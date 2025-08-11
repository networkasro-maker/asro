import React from 'react';
import { Customer, InternetPackage, IspProfile } from '../types';

interface InvoiceTemplateProps {
  customer: Customer;
  pkg: InternetPackage;
  ispProfile: IspProfile;
}

const InvoiceTemplate: React.FC<InvoiceTemplateProps> = ({ customer, pkg, ispProfile }) => {
  const invoiceDate = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
  const dueDate = new Date(customer.dueDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });

  return (
    <div
      style={{ width: '302px' }}
      className="bg-white text-black font-mono p-3"
    >
      <div className="text-center">
        <img src={ispProfile.logoUrl} alt="Logo" className="mx-auto h-12 mb-2" />
        <h1 className="font-bold text-lg">{ispProfile.name}</h1>
        <p className="text-xs">{ispProfile.address}</p>
        <p className="text-xs">Telp: {ispProfile.contact}</p>
      </div>

      <hr className="border-t-2 border-dashed border-black my-2" />

      <div className="text-xs">
        <p><strong>Pelanggan:</strong> {customer.name}</p>
        <p><strong>ID:</strong> {customer.id.toUpperCase()}</p>
        <p><strong>Alamat:</strong> {customer.address}</p>
      </div>

      <hr className="border-t-2 border-dashed border-black my-2" />

      <div className="text-xs flex justify-between">
        <p><strong>No. Invoice:</strong> INV-{customer.id}-{new Date().getMonth()+1}{new Date().getFullYear()}</p>
        <p><strong>Tanggal:</strong> {invoiceDate}</p>
      </div>

      <hr className="border-t-2 border-dashed border-black my-2" />

      <table className="w-full text-xs">
        <thead>
          <tr>
            <th className="text-left">Deskripsi</th>
            <th className="text-right">Harga</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="py-1">{pkg.name}</td>
            <td className="text-right py-1">Rp{pkg.price.toLocaleString('id-ID')}</td>
          </tr>
        </tbody>
      </table>

      <hr className="border-t-2 border-dashed border-black my-2" />

      <div className="flex justify-between font-bold text-sm">
        <p>TOTAL</p>
        <p>Rp{pkg.price.toLocaleString('id-ID')}</p>
      </div>
      
      <div className="text-xs mt-1">
        <p><strong>Jatuh Tempo:</strong> {dueDate}</p>
      </div>

      <hr className="border-t-2 border-dashed border-black my-2" />

      <div className="text-center text-xs">
        <p className="font-bold">Informasi Pembayaran:</p>
        {ispProfile.bankAccounts.map(bank => (
          <p key={bank.accountNumber}>
            {bank.bankName}: {bank.accountNumber} (a.n {bank.accountName})
          </p>
        ))}
      </div>
      
      <hr className="border-t-2 border-dashed border-black my-2" />
      
      <div className="text-center text-xs mt-2">
        <p>Terima kasih atas pembayaran Anda.</p>
        <p>Simpan struk ini sebagai bukti pembayaran yang sah.</p>
      </div>
    </div>
  );
};

export default InvoiceTemplate;
