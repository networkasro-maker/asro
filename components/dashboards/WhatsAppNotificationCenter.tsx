import React, { useState, useMemo } from 'react';
import { GoogleGenAI } from "@google/genai";
import { User, Customer, InternetPackage, WhatsAppTemplate, PaymentStatus } from '../../types';
import Modal from '../Modal';
import { SparklesIcon } from '../icons';

interface WhatsAppNotificationCenterProps {
  user: User;
  customers: Customer[];
  packages: InternetPackage[];
  waTemplates: WhatsAppTemplate[];
  addActivityLog: (action: string, user: User) => void;
}

const statusConfig: { [key: string]: { color: string; bg: string; text: string; } } = {
    [PaymentStatus.PAID]: { color: 'text-green-400', bg: 'bg-green-500/10', text: 'Lunas' },
    [PaymentStatus.UNPAID]: { color: 'text-red-400', bg: 'bg-red-500/10', text: 'Belum Bayar' },
    [PaymentStatus.VERIFYING]: { color: 'text-yellow-400', bg: 'bg-yellow-500/10', text: 'Verifikasi' },
};

const WhatsAppNotificationCenter: React.FC<WhatsAppNotificationCenterProps> = ({ user, customers, packages, waTemplates, addActivityLog }) => {
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<PaymentStatus | 'All'>('All');
  const [isModalOpen, setModalOpen] = useState(false);
  
  const [message, setMessage] = useState('');
  const [aiPrompt, setAiPrompt] = useState('');
  const [isLoadingAi, setIsLoadingAi] = useState(false);

  const filteredCustomers = useMemo(() => {
    return filter === 'All' ? customers : customers.filter(c => c.paymentStatus === filter);
  }, [customers, filter]);

  const handleSelectCustomer = (customerId: string, isSelected: boolean) => {
    const newSet = new Set(selectedCustomerIds);
    if (isSelected) {
      newSet.add(customerId);
    } else {
      newSet.delete(customerId);
    }
    setSelectedCustomerIds(newSet);
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedCustomerIds(new Set(filteredCustomers.map(c => c.id)));
    } else {
      setSelectedCustomerIds(new Set());
    }
  };

  const openModal = () => {
    if (selectedCustomerIds.size > 0) {
      setMessage('');
      setAiPrompt('');
      setModalOpen(true);
    }
  };
  
  const replacePlaceholders = (template: string, customer: Customer) => {
      const pkg = packages.find(p => p.id === customer.packageId);
      return template
          .replace(/{nama}/g, customer.name)
          .replace(/{alamat}/g, customer.address)
          .replace(/{paket}/g, pkg?.name || '')
          .replace(/{tagihan}/g, `Rp ${pkg?.price.toLocaleString('id-ID') || ''}`)
          .replace(/{jatuh_tempo}/g, new Date(customer.dueDate).toLocaleDateString('id-ID'));
  };

  const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const templateId = e.target.value;
    const template = waTemplates.find(t => t.id === templateId);
    if (template) {
        const firstSelectedId = Array.from(selectedCustomerIds)[0];
        const customerExample = customers.find(c => c.id === firstSelectedId);
        setMessage(customerExample ? replacePlaceholders(template.template, customerExample) : template.template);
    }
  };
  
  const handleGenerateAi = async () => {
    if (!aiPrompt) return;
    setIsLoadingAi(true);
    setMessage('');
    try {
        const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
        const systemInstruction = "Anda adalah asisten AI untuk ASRO.NET, penyedia layanan internet lokal. Tugas Anda adalah membantu admin membuat draf pesan WhatsApp yang ramah, jelas, dan profesional untuk pelanggan. Anda dapat menggunakan placeholder berikut: {nama}, {tagihan}, {jatuh_tempo}. Balas HANYA dengan teks pesan yang akan dikirim, tanpa tambahan kata pengantar atau penutup.";
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: aiPrompt,
            config: {
                systemInstruction: systemInstruction
            }
        });
        setMessage(response.text.trim());
    } catch (error) {
        console.error("AI generation failed:", error);
        alert("Gagal membuat pesan dengan AI. Silakan coba lagi.");
    } finally {
        setIsLoadingAi(false);
    }
  };

  const handleSendMessage = () => {
    if (!message || selectedCustomerIds.size === 0) return;
    
    if (selectedCustomerIds.size === 1) {
        const customerId = Array.from(selectedCustomerIds)[0];
        const customer = customers.find(c => c.id === customerId);
        if (customer && customer.phone) {
            const finalMessage = replacePlaceholders(message, customer);
            const whatsappUrl = `https://wa.me/${customer.phone}?text=${encodeURIComponent(finalMessage)}`;
            window.open(whatsappUrl, '_blank');
            addActivityLog(`Mengirim notifikasi WA ke ${customer.name}`, user);
        } else {
            alert("Pelanggan tidak memiliki nomor telepon atau tidak ditemukan.");
        }
    } else {
        alert(`Simulasi pengiriman pesan massal ke ${selectedCustomerIds.size} pelanggan berhasil!`);
        addActivityLog(`Mengirim notifikasi WA massal ke ${selectedCustomerIds.size} pelanggan`, user);
    }
    setModalOpen(false);
    setSelectedCustomerIds(new Set());
  };


  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Pusat Notifikasi WhatsApp</h1>

      <div className="bg-slate-800/50 rounded-lg p-4">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
          <div className="flex flex-wrap space-x-1 bg-slate-700/50 p-1 rounded-lg">
            {(['All', ...Object.values(PaymentStatus)] as const).map(s => (
                <button key={s} onClick={() => setFilter(s)} className={`px-4 py-1.5 text-sm font-medium rounded-md transition ${filter === s ? 'bg-blue-600 text-white shadow' : 'text-slate-300 hover:bg-slate-600'}`}>
                    {s === 'All' ? 'Semua' : statusConfig[s]?.text || s}
                </button>
            ))}
          </div>
          <button 
            onClick={openModal}
            disabled={selectedCustomerIds.size === 0} 
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg w-full sm:w-auto disabled:bg-slate-600 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            Kirim Pesan WA ({selectedCustomerIds.size})
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-300">
            <thead className="text-xs text-slate-400 uppercase bg-slate-700/50">
              <tr>
                <th scope="col" className="p-4">
                  <input type="checkbox" className="bg-slate-700 border-slate-500 rounded" onChange={handleSelectAll} checked={filteredCustomers.length > 0 && selectedCustomerIds.size === filteredCustomers.length} />
                </th>
                <th scope="col" className="px-6 py-3">Nama Pelanggan</th>
                <th scope="col" className="px-6 py-3">Status</th>
                <th scope="col" className="px-6 py-3">No. Telepon</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map(c => {
                const status = statusConfig[c.paymentStatus] || { color: 'text-slate-400', bg: 'bg-slate-600/20', text: 'N/A' };
                return (
                  <tr key={c.id} className="bg-slate-800 border-b border-slate-700 hover:bg-slate-700/50">
                    <td className="p-4">
                      <input type="checkbox" className="bg-slate-700 border-slate-500 rounded" checked={selectedCustomerIds.has(c.id)} onChange={(e) => handleSelectCustomer(c.id, e.target.checked)} />
                    </td>
                    <td className="px-6 py-4 font-medium text-white">{c.name}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.bg} ${status.color}`}>{status.text}</span>
                    </td>
                    <td className="px-6 py-4">{c.phone || '-'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {filteredCustomers.length === 0 && <p className="text-center text-slate-400 py-8">Tidak ada pelanggan dengan filter ini.</p>}
        </div>
      </div>
      
      <Modal isOpen={isModalOpen} onClose={() => setModalOpen(false)} title="Tulis & Kirim Notifikasi WhatsApp" size="lg">
        <div className="space-y-4">
            <p className="text-sm text-slate-400">Akan dikirim ke {selectedCustomerIds.size} pelanggan terpilih.</p>
            
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Gunakan Template</label>
               <select onChange={handleTemplateChange} className="w-full bg-slate-700 border border-slate-600 rounded-lg p-2 text-white">
                    <option value="">Pilih Template...</option>
                    {waTemplates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
            </div>
            
            <div className="relative">
                <div className="absolute top-0 right-0 p-2 text-xs text-blue-400 font-bold flex items-center">
                    <SparklesIcon className="w-4 h-4 mr-1"/> AI Powered
                </div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Atau Buat dengan AI</label>
                <div className="flex gap-2">
                    <input 
                        type="text" 
                        value={aiPrompt}
                        onChange={e => setAiPrompt(e.target.value)}
                        placeholder="e.g. ingatkan tagihan jatuh tempo 3 hari lagi"
                        className="flex-grow w-full bg-slate-700 border border-slate-600 rounded-lg p-2 text-white"
                    />
                    <button onClick={handleGenerateAi} disabled={isLoadingAi} className="bg-blue-600 hover:bg-blue-700 text-white font-bold p-2 rounded-lg disabled:bg-slate-600">
                        {isLoadingAi ? (
                             <div className="w-5 h-5 border-2 border-dashed rounded-full animate-spin border-white"></div>
                        ) : 'Buat'}
                    </button>
                </div>
            </div>

            <div>
                 <label className="block text-sm font-medium text-slate-300 mb-1">Isi Pesan</label>
                 <textarea 
                    rows={6} 
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    placeholder="Tulis pesan Anda di sini..."
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500"
                ></textarea>
                <p className="text-xs text-slate-500 mt-1">Gunakan placeholder: {'{nama}, {tagihan}, {jatuh_tempo}'}</p>
            </div>
            
             <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setModalOpen(false)} className="bg-slate-600 hover:bg-slate-500 text-white font-bold py-2 px-4 rounded-lg">Batal</button>
                <button type="button" onClick={handleSendMessage} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg">Kirim Sekarang</button>
            </div>
        </div>
      </Modal>

    </div>
  );
};

export default WhatsAppNotificationCenter;