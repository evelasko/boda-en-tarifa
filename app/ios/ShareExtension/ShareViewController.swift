//
//  ShareViewController.swift
//  ShareExtension
//
//  Created by Enrique Perez Velasco on 4/3/26.
//
import receive_sharing_intent
import UIKit
import Social

class ShareViewController: RSIShareViewController {

    // Auto-redirect to host app immediately after the user taps the app
    // icon in the share sheet. No extra UI is shown in the extension.
    override func shouldAutoRedirect() -> Bool {
        return true
    }

    override func didSelectPost() {
        // This is called after the user selects Post. Do the upload of contentText and/or NSExtensionContext attachments.
    
        // Inform the host that we're done, so it un-blocks its UI. Note: Alternatively you could call super's -didSelectPost, which will similarly complete the extension context.
        self.extensionContext!.completeRequest(returningItems: [], completionHandler: nil)
    }

    override func configurationItems() -> [Any]! {
        // To add configuration options via table cells at the bottom of the sheet, return an array of SLComposeSheetConfigurationItem here.
        return []
    }

}
