import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { photo_url } = await req.json();
    if (!photo_url) return Response.json({ error: 'photo_url is required' }, { status: 400 });

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are analyzing a photo of a supplier delivery note or label from a packaging/corrugated board manufacturer.
Extract the following information from the image:
- supplier_name: The name of the supplier or manufacturer (look for company name, letterhead, or "From:" fields)
- lot_ref: Any lot reference, batch number, or delivery note number (look for "Lot", "Batch", "DN", "Delivery Note", "Ref", "Invoice" numbers)
- raw_material: Any mention of material type or product description (e.g. "Kraft Liner", "Fluting", "Testliner", "Board")
- qty: Any quantity mentioned (number only, no units)

Return only what you can confidently read. If a field is not visible or unclear, return null for that field.`,
      file_urls: [photo_url],
      response_json_schema: {
        type: "object",
        properties: {
          supplier_name: { type: "string" },
          lot_ref: { type: "string" },
          raw_material: { type: "string" },
          qty: { type: "number" }
        }
      }
    });

    // Try to find a matching supplier in the database
    const suppliers = await base44.asServiceRole.entities.Supplier.list();
    let matched_supplier_id = null;

    if (result.supplier_name && suppliers.length > 0) {
      const nameLower = result.supplier_name.toLowerCase();
      const match = suppliers.find(s =>
        s.name?.toLowerCase().includes(nameLower) ||
        nameLower.includes(s.name?.toLowerCase())
      );
      if (match) matched_supplier_id = match.id;
    }

    return Response.json({
      supplier_name: result.supplier_name || null,
      lot_ref: result.lot_ref || null,
      raw_material: result.raw_material || null,
      qty: result.qty || null,
      matched_supplier_id
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});