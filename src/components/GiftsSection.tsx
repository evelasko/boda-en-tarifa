'use client'
import Image from 'next/image'
import React, { useState } from 'react'
import Typography, { combineTypographyClasses } from '@/lib/typography'
import { SlideImage } from './SlideImage'

export function GiftsSection() {
  const [notification, setNotification] = useState<{ message: string; show: boolean }>({ message: '', show: false })
  const [cryptoModal, setCryptoModal] = useState<{ show: boolean; type: string; address: string; qr: string }>({ 
    show: false, 
    type: '', 
    address: '', 
    qr: '' 
  })

  const accountNumber = 'ES00 0000 0000 0000 0000'
  const bizumNumber = ['609971307', '655433018']
  const cryptoAddresses = {
    ether: { address:'0x9203EF2BeEd6ffc61C5165e1cd22764b304D7C4d', qr: '/graphics/ether.svg'}, 
    bitcoin: { address:'bc1qlv9n8crt84ma4a99t8fa7sf43n0f7a9zq62r02', qr: '/graphics/bitcoin.svg'}, 
  }

  const copyToClipboard = async (text: string, message: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setNotification({ message, show: true })
      setTimeout(() => setNotification({ message: '', show: false }), 3000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  const openCryptoModal = (type: string, address: string, qr: string) => {
    setCryptoModal({ show: true, type, address, qr })
  }

  const closeCryptoModal = () => {
    setCryptoModal({ show: false, type: '', address: '', qr: '' })
  }
  
  return (
    <section id="gifts" className="bg-sea-texture bg-contain bg-repeat-y">
      <div className="w-full h-[83px] bg-divider-stick bg-repeat-x bg-contain" />
      <div className="pt-20 lg:pt-32 container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center">
          {/* Icon */}
          <div className="flex justify-center mb-8">
            <div className="w-[200] h-[200] flex items-center justify-center">
              <Image src="/icons/gift.png" alt="Gift" width={200} height={200} />
            </div>
          </div>
          
          <h2 className={combineTypographyClasses(Typography.Display.Medium, 'mb-8 text-white/70 text-center')}>
            Regalos
          </h2>
          
          <p className="type-body-large text-white/80 mb-12">
            Vuestra presencia ya es un regalo, así que lo importante es que vengáis. Pero si queréis colaborar, nos encanta viajar, y podéis contribuir a añadir kilómetros a nuestra luna de miel a través de la siguiente cuenta, Bizum, ETH bitcoin etc.
          </p>
          
          {/* Gift Options */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-sand/10 rounded-lg p-6">
            <div className="flex justify-center">
            <Image src="/icons/card.png" alt="Card" width={100} height={100} />
            </div>
              <h3 className="type-heading-tertiary text-white/70 mb-2">
                Transferencia Bancaria
              </h3>
              <p className="type-body-small text-white/50 mb-4">
                Opción tradicional de transferencia bancaria
              </p>
              <button
                onClick={() => copyToClipboard(accountNumber, 'Número de cuenta copiado')}
                className="w-full bg-sand/20 hover:bg-sand/30 text-white px-4 py-2 rounded-lg transition-colors duration-200 type-label"
              >
                Copiar número de cuenta
              </button>
            </div>
            
            <div className="bg-coral/10 rounded-lg p-6">
            <div className="flex justify-center">
            <Image src="/icons/smartphone.png" alt="Bizum" width={100} height={100} />
            </div>
              <h3 className="type-heading-tertiary text-white mb-2">
                Bizum
              </h3>
              <p className="type-body-small text-white/70 mb-4">
                Pago móvil rápido
              </p>
              <div className="space-y-2">
                {bizumNumber.map((number, index) => (
                  <button
                    key={index}
                    onClick={() => copyToClipboard(number, `Número Bizum copiado: ${number}`)}
                    className="w-full bg-coral/20 hover:bg-coral/30 text-white px-4 py-2 rounded-lg transition-colors duration-200 type-label"
                  >
                    Copiar {number}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="bg-ocean/10 rounded-lg p-6">
              <div className="flex justify-center">
                <Image src="/icons/coin.png" alt="Bitcoin" width={100} height={100} />
              </div>
              <h3 className="type-heading-tertiary text-white mb-2">
                Criptomonedas
              </h3>
              <p className="type-body-small text-white/70 mb-4">
                ETH, Bitcoin y más
              </p>
              <div className="space-y-2">
                {Object.entries(cryptoAddresses).map(([type, data]) => (
                  <button
                    key={type}
                    onClick={() => openCryptoModal(type, data.address, data.qr)}
                    className="w-full bg-ocean/20 hover:bg-ocean/30 text-white px-4 py-2 rounded-lg transition-colors duration-200 type-label capitalize"
                  >
                    Ver QR {type}
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          {/* <p className="type-body-small text-white/50">
            Contáctanos para detalles específicos de pago
          </p> */}
          
        </div>
      </div>
      
      {/* Notification */}
      {notification.show && (
        <div className="fixed top-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-in slide-in-from-right duration-300">
          {notification.message}
        </div>
      )}
      
      {/* Crypto Modal */}
      {cryptoModal.show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-800 capitalize">
                {cryptoModal.type} Wallet
              </h3>
              <button
                onClick={closeCryptoModal}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            
            <div className="text-center mb-6">
              <div className="bg-gray-100 p-4 rounded-lg mb-4">
                <Image
                  src={cryptoModal.qr}
                  alt={`${cryptoModal.type} QR Code`}
                  width={200}
                  height={200}
                  className="mx-auto"
                />
              </div>
              
              <div className="bg-gray-100 p-3 rounded-lg mb-4">
                <p className="text-sm text-gray-600 mb-2">Dirección de la wallet:</p>
                <p className="font-mono text-sm break-all text-gray-800">
                  {cryptoModal.address}
                </p>
              </div>
              
              <button
                onClick={() => copyToClipboard(cryptoModal.address, 'Dirección copiada al portapapeles')}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
              >
                Copiar dirección
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Image Area - Full Width */}
      <div className="w-full relative">
        <SlideImage
          src="/slides/sea.jpg"
          alt="Kite slide continuation"
          originalWidth={1920}
          originalHeight={2033}
          maskHeight={350}
        />
      </div>
    </section>
  )
}