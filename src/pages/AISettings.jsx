import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { testApiKey } from '@/api/openai';
import { Key, CheckCircle2, XCircle, Loader2, Eye, EyeOff, Trash2, BrainCircuit } from 'lucide-react';

export default function AISettings() {
  const { user } = useAuth();
  const [record, setRecord] = useState(null);
  const [apiKey, setApiKey] = useState('');
  const [label, setLabel] = useState('My OpenAI Key');
  const [showKey, setShowKey] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [msg, setMsg] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const keys = await base44.entities.UserApiKey.filter({ user_id: user.id });
      if (keys[0]) {
        setRecord(keys[0]);
        setLabel(keys[0].key_label || 'My OpenAI Key');
        setApiKey('');
      } else {
        setRecord(null);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => { if (user?.id) load(); }, [user]);

  const handleTest = async () => {
    const keyToTest = apiKey.trim();
    if (!keyToTest) return;
    setTesting(true);
    setTestResult(null);
    const ok = await testApiKey(keyToTest);
    setTestResult(ok ? 'valid' : 'invalid');
    setTesting(false);
  };

  const handleSave = async () => {
    if (!apiKey.trim()) { setMsg({ type: 'error', text: 'Please enter an API key.' }); return; }
    setSaving(true);
    setMsg(null);
    try {
      const data = {
        user_id: user.id,
        openai_api_key: apiKey.trim(),
        key_label: label || 'My OpenAI Key',
        test_status: testResult || 'untested',
        last_tested_at: testResult ? new Date().toISOString() : null,
      };
      if (record) await base44.entities.UserApiKey.update(record.id, data);
      else await base44.entities.UserApiKey.create(data);
      setMsg({ type: 'success', text: 'API key saved successfully.' });
      setApiKey('');
      setTestResult(null);
      await load();
    } catch (e) {
      setMsg({ type: 'error', text: 'Failed to save: ' + e.message });
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!record) return;
    if (!confirm('Remove your OpenAI API key? AI features will stop working.')) return;
    try {
      await base44.entities.UserApiKey.update(record.id, {
        openai_api_key: '',
        test_status: 'untested',
        last_tested_at: null,
      });
      setRecord(null);
      setApiKey('');
      setTestResult(null);
      setMsg({ type: 'success', text: 'API key removed.' });
    } catch (e) {
      setMsg({ type: 'error', text: 'Failed to remove: ' + e.message });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const hasKey = !!record?.openai_api_key;

  const statusBadge = hasKey ? (
    record.test_status === 'valid'
      ? <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-green-500/15 text-green-400">Verified</span>
      : record.test_status === 'invalid'
      ? <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-red-500/15 text-red-400">Invalid</span>
      : <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-amber-500/15 text-amber-400">Untested</span>
  ) : null;

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <BrainCircuit className="w-6 h-6 text-amber-400" />
          <h1 className="text-2xl font-bold">AI Settings</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Connect your own OpenAI API key. Your key is stored securely against your account only — AI features use your credits, not shared credits.
        </p>
      </div>

      {hasKey && (
        <div className="bg-card border border-border rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-amber-400" />
              <span className="font-medium text-sm">{record.key_label || 'OpenAI API Key'}</span>
            </div>
            <button
              onClick={handleDelete}
              className="text-muted-foreground hover:text-red-400 transition-colors p-1 rounded"
              title="Remove key"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
          <div className="text-xs text-muted-foreground font-mono bg-secondary rounded px-3 py-2">
            sk-{'•'.repeat(32)}{record.openai_api_key?.slice(-4)}
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {statusBadge}
            {record.last_tested_at && (
              <span>Last tested {new Date(record.last_tested_at).toLocaleDateString()}</span>
            )}
          </div>
        </div>
      )}

      <div className="bg-card border border-border rounded-xl p-5 space-y-4">
        <h3 className="font-semibold text-sm">{hasKey ? 'Update API Key' : 'Add Your OpenAI API Key'}</h3>

        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Key Label</label>
          <input
            value={label}
            onChange={e => setLabel(e.target.value)}
            placeholder="e.g. Work Key"
            className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-1 block">
            OpenAI API Key{hasKey ? ' (enter new key to replace existing)' : ' *'}
          </label>
          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={e => { setApiKey(e.target.value); setTestResult(null); setMsg(null); }}
              placeholder="sk-..."
              className="w-full bg-secondary border border-border rounded-lg px-3 py-2 pr-10 text-sm font-mono outline-none focus:ring-1 focus:ring-primary"
            />
            <button
              type="button"
              onClick={() => setShowKey(p => !p)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Get your key at platform.openai.com → API Keys
          </p>
        </div>

        {testResult && (
          <div className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg ${
            testResult === 'valid' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
          }`}>
            {testResult === 'valid'
              ? <CheckCircle2 className="w-4 h-4" />
              : <XCircle className="w-4 h-4" />}
            {testResult === 'valid'
              ? 'API key is valid and working.'
              : 'API key is invalid or has no access.'}
          </div>
        )}

        {msg && (
          <div className={`text-sm px-3 py-2 rounded-lg ${
            msg.type === 'success' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
          }`}>
            {msg.text}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={handleTest}
            disabled={!apiKey.trim() || testing}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm border border-border hover:bg-secondary disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
            Test Key
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !apiKey.trim()}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm bg-primary text-primary-foreground hover:bg-primary/90 font-medium disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {hasKey ? 'Update Key' : 'Save Key'}
          </button>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-5 space-y-3">
        <h3 className="font-semibold text-sm">How it works</h3>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-start gap-2"><span className="text-amber-400 font-bold mt-0.5">1.</span>You enter your own OpenAI API key above.</li>
          <li className="flex items-start gap-2"><span className="text-amber-400 font-bold mt-0.5">2.</span>The key is stored securely against your user account only.</li>
          <li className="flex items-start gap-2"><span className="text-amber-400 font-bold mt-0.5">3.</span>Whenever you use an AI feature (e.g. NCR root-cause suggestions, CAPA drafts), the request is made with your key — no shared credits.</li>
          <li className="flex items-start gap-2"><span className="text-amber-400 font-bold mt-0.5">4.</span>Other users must add their own key to access AI features.</li>
        </ul>
      </div>
    </div>
  );
}
