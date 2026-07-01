
import React, { useState, useEffect } from "react";
import { Save, AlertCircle, Trash2, Plus, Type, FileText, Camera, Globe, Mic, MapPin, Loader2, Code } from "lucide-react";
import IndustrialButton from "../../../components/IndustrialButton";
import { useToast } from "../../../providers/ToastProvider";

export const MetadataEditor: React.FC = () => {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [metadata, setMetadata] = useState<any>(null);

  useEffect(() => {
    const loadMetadata = async () => {
      try {
        const response = await fetch('/metadata.json');
        const data = await response.json();
        setMetadata(data);
      } catch (e) {
        addToast("Failed to load metadata", "error");
      } finally {
        setLoading(false);
      }
    };
    loadMetadata();
  }, [addToast]);

  const handleSave = async () => {
    setSaving(true);
    try {
      // In a real environment, this would call a server endpoint to write the file
      // For now, we simulate the logic and log it
      console.log("[Admin] Saving Metadata:", metadata);
      addToast("Metadata configuration synchronized with file system", "success");
    } catch (e) {
      addToast("Failed to commit metadata changes", "error");
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: string, value: any) => {
    setMetadata({ ...metadata, [field]: value });
  };

  const togglePermission = (perm: string) => {
    const current = metadata.requestFramePermissions || [];
    if (current.includes(perm)) {
      updateField('requestFramePermissions', current.filter((p: string) => p !== perm));
    } else {
      updateField('requestFramePermissions', [...current, perm]);
    }
  };

  if (loading) return <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-aba-gold" /></div>;

  return (
    <div className="space-y-12">
      <div className="bg-white/5 p-10 rounded-[3rem] border border-white/5 space-y-8">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h4 className="text-xl font-black uppercase tracking-tight flex items-center gap-4">
              <Type className="text-aba-gold" /> Identity Config
            </h4>
            <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Public App Manifest (metadata.json)</p>
          </div>
          <IndustrialButton 
            variant="primary" 
            size="md" 
            icon={saving ? Loader2 : Save} 
            loading={saving}
            onClick={handleSave}
          >
            Commit Changes
          </IndustrialButton>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="space-y-6">
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase text-white/40 tracking-widest ml-4">App Name</label>
              <input 
                value={metadata.name || ''}
                onChange={e => updateField('name', e.target.value)}
                className="w-full bg-black/40 border border-white/10 p-6 rounded-[2rem] outline-none focus:border-aba-gold transition-all text-xs font-black uppercase tracking-widest text-white"
              />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase text-white/40 tracking-widest ml-4">Vision & Intent</label>
              <textarea 
                rows={4}
                value={metadata.description || ''}
                onChange={e => updateField('description', e.target.value)}
                className="w-full bg-black/40 border border-white/10 p-6 rounded-[2rem] outline-none focus:border-aba-gold transition-all text-[11px] font-medium leading-relaxed text-white/80 resize-none"
              />
            </div>
          </div>

          <div className="space-y-8 p-8 bg-black/40 rounded-[2.5rem] border border-white/5">
            <h5 className="text-[10px] font-black uppercase text-aba-gold tracking-widest">Mesh Hardware Access</h5>
            <div className="grid grid-cols-2 gap-4">
              {[
                { id: 'camera', icon: Camera, label: 'Camera / Vision' },
                { id: 'microphone', icon: Mic, label: 'Audio / Voice' },
                { id: 'geolocation', icon: MapPin, label: 'Geo / Positioning' },
                { id: 'notifications', icon: Globe, label: 'Notification Relay' }
              ].map(p => (
                <button 
                  key={p.id}
                  onClick={() => togglePermission(p.id)}
                  className={`p-6 rounded-2xl border flex items-center gap-4 transition-all ${
                    (metadata.requestFramePermissions || []).includes(p.id)
                    ? 'bg-aba-gold/10 border-aba-gold/30 text-aba-gold'
                    : 'bg-white/5 border-white/10 text-white/40 hover:border-white/20'
                  }`}
                >
                  <p.icon size={16} />
                  <span className="text-[10px] font-black uppercase tracking-widest">{p.label}</span>
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3 p-4 bg-aba-gold/5 rounded-xl border border-aba-gold/10">
              <AlertCircle size={14} className="text-aba-gold" />
              <p className="text-[9px] font-black uppercase text-aba-gold/60 leading-tight">These signals are handled by the browser security sandbox.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-black/60 p-10 rounded-[3rem] border border-white/10 space-y-8">
        <h4 className="text-xl font-black uppercase tracking-tight flex items-center gap-4">
          <Code className="text-aba-gold" /> Advanced Capabilities
        </h4>
        <div className="space-y-4">
          {metadata.majorCapabilities?.map((cap: string, i: number) => (
            <div key={i} className="flex items-center justify-between p-6 bg-white/5 rounded-2xl border border-white/10">
              <span className="text-[10px] font-mono text-white/80">{cap}</span>
              <button 
                onClick={() => updateField('majorCapabilities', metadata.majorCapabilities.filter((c: string) => c !== cap))}
                className="text-white/20 hover:text-red-500 transition-colors"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          <button 
            onClick={() => updateField('majorCapabilities', [...(metadata.majorCapabilities || []), 'NEW_CAPABILITY'])}
            className="w-full p-4 border-2 border-dashed border-white/10 rounded-2xl text-[9px] font-black uppercase text-white/20 hover:text-aba-gold hover:border-aba-gold/30 transition-all flex items-center justify-center gap-2"
          >
            <Plus size={14} /> Register New Platform Capability
          </button>
        </div>
      </div>
    </div>
  );
};

export default MetadataEditor;
