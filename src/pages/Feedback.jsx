import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Star, MessageSquare, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function FeedbackPage() {
  const [form, setForm] = useState({ name: "", email: "", category: "general", rating: 0, message: "" });
  const [hoveredStar, setHoveredStar] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.message.trim()) return;
    setSaving(true);
    await base44.entities.Feedback.create({
      ...form,
      rating: form.rating || undefined,
    });
    setSubmitted(true);
    setSaving(false);
  };

  const handleReset = () => {
    setForm({ name: "", email: "", category: "general", rating: 0, message: "" });
    setSubmitted(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Feedback</h1>
        <p className="text-slate-500 mt-1">Share your thoughts, suggestions, or report issues</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/60 p-8">
        <AnimatePresence mode="wait">
          {submitted ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-10"
            >
              <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
              </div>
              <h3 className="text-xl font-semibold text-slate-800 mb-2">Thank you for your feedback!</h3>
              <p className="text-slate-500 mb-6">Your response has been recorded and will be reviewed.</p>
              <Button
                variant="outline"
                onClick={handleReset}
                className="rounded-xl"
              >
                Submit Another
              </Button>
            </motion.div>
          ) : (
            <motion.form
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onSubmit={handleSubmit}
              className="space-y-5"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-emerald-500" />
                </div>
                <p className="text-sm text-slate-600">We value your input to help improve our ISO 9001:2015 compliance process.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-slate-500 block mb-1.5">Name (optional)</label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Your name"
                    className="h-10"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500 block mb-1.5">Email (optional)</label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="your@email.com"
                    className="h-10"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-500 block mb-1.5">Category</label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General Feedback</SelectItem>
                    <SelectItem value="bug">Bug / Issue</SelectItem>
                    <SelectItem value="feature_request">Feature Request</SelectItem>
                    <SelectItem value="improvement">Improvement Suggestion</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-500 block mb-2">Overall Rating (optional)</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoveredStar(star)}
                      onMouseLeave={() => setHoveredStar(0)}
                      onClick={() => setForm({ ...form, rating: star })}
                      className="p-1 transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-7 h-7 transition-colors ${
                          star <= (hoveredStar || form.rating)
                            ? "fill-amber-400 text-amber-400"
                            : "text-slate-200"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-500 block mb-1.5">
                  Message <span className="text-red-400">*</span>
                </label>
                <Textarea
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder="Describe your feedback in detail..."
                  className="min-h-[120px] resize-none"
                  required
                />
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  type="submit"
                  disabled={saving || !form.message.trim()}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 rounded-xl"
                >
                  {saving ? "Submitting..." : "Submit Feedback"}
                </Button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}