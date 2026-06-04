import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Allow scheduled/internal calls (no user session required)
    // Fetch all active RM batches and raw materials
    const [batches, materials] = await Promise.all([
      base44.asServiceRole.entities.RMBatch.filter({ status: "released" }),
      base44.asServiceRole.entities.RawMaterial.list(),
    ]);

    // Aggregate qty_remaining per raw_material_id
    const stockByRM = {};
    for (const batch of batches) {
      if (!batch.raw_material_id) continue;
      stockByRM[batch.raw_material_id] = (stockByRM[batch.raw_material_id] || 0) + (batch.qty_remaining || 0);
    }

    // Find materials below reorder point
    const alerts = [];
    for (const rm of materials) {
      if (!rm.reorder_point) continue;
      const onHand = stockByRM[rm.id] || 0;
      if (onHand < rm.reorder_point) {
        alerts.push({
          rm_code: rm.rm_code,
          name: rm.name,
          on_hand: onHand,
          reorder_point: rm.reorder_point,
          unit: rm.unit || "sheets",
          deficit: rm.reorder_point - onHand,
        });
      }
    }

    if (alerts.length === 0) {
      return Response.json({ sent: false, message: "All stock levels OK", alerts: [] });
    }

    // Find all admin users to notify
    const admins = await base44.asServiceRole.entities.User.filter({ role: "admin" });
    const recipients = admins.map(u => u.email).filter(Boolean);

    if (recipients.length === 0) {
      return Response.json({ sent: false, message: "No admin recipients found", alerts });
    }

    // Build email body
    const rows = alerts.map(a =>
      `  • ${a.rm_code} — ${a.name}: ${a.on_hand.toLocaleString()} ${a.unit} on hand (reorder point: ${a.reorder_point.toLocaleString()}, deficit: ${a.deficit.toLocaleString()})`
    ).join("\n");

    const body = `⚠️ LOW STOCK ALERT — MacArt IMS\n\nThe following raw materials have fallen below their reorder points:\n\n${rows}\n\nPlease place purchase orders immediately to avoid production delays.\n\n— MacArt IMS Automated Alert`;

    // Send email to each admin
    for (const email of recipients) {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: email,
        from_name: "MacArt IMS",
        subject: `⚠️ Low Stock Alert — ${alerts.length} material${alerts.length > 1 ? "s" : ""} below reorder point`,
        body,
      });
    }

    return Response.json({
      sent: true,
      recipients,
      alerts,
      message: `Sent alert for ${alerts.length} material(s) to ${recipients.length} recipient(s)`,
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});