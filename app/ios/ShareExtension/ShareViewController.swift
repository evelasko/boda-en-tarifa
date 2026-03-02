//
//  ShareViewController.swift
//  ShareExtension
//
//  Boda en Tarifa — Share Extension
//
import receive_sharing_intent

class ShareViewController: RSIShareViewController {

    // Auto-redirect to host app immediately after the user taps the app
    // icon in the share sheet. No extra UI is shown in the extension.
    override func shouldAutoRedirect() -> Bool {
        return true
    }
}
