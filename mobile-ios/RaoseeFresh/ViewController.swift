import UIKit
import WebKit

/**
 * ViewController for Rasoee Fresh Supermarket iOS App
 * Implements WKWebView with WhatsApp deep link routing, UPI payments, and pull-to-refresh.
 */
class ViewController: UIViewController, WKNavigationDelegate, WKUIDelegate {

    private var webView: WKWebView!
    private var progressView: UIProgressView!
    private var refreshControl: UIRefreshControl!

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = UIColor(red: 12/255, green: 131/255, blue: 31/255, alpha: 1.0)
        
        setupWebView()
        setupProgressView()
        setupRefreshControl()
        loadStorefront()
    }

    private func setupWebView() {
        let config = WKWebViewConfiguration()
        config.allowsInlineMediaPlayback = true
        config.preferences.javaScriptEnabled = true
        
        webView = WKWebView(frame: .zero, configuration: config)
        webView.navigationDelegate = self
        webView.uiDelegate = self
        webView.translatesAutoresizingMaskIntoConstraints = false
        webView.scrollView.bounces = true
        webView.customUserAgent = "RasoeeFreshApp/1.0.0 (iOS; iPhone)"

        view.addSubview(webView)
        NSLayoutConstraint.activate([
            webView.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor),
            webView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            webView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            webView.bottomAnchor.constraint(equalTo: view.bottomAnchor)
        ])

        webView.addObserver(self, forKeyPath: #keyPath(WKWebView.estimatedProgress), options: .new, context: nil)
    }

    private func setupProgressView() {
        progressView = UIProgressView(progressViewStyle: .bar)
        progressView.progressTintColor = UIColor(red: 12/255, green: 131/255, blue: 31/255, alpha: 1.0)
        progressView.trackTintColor = .clear
        progressView.translatesAutoresizingMaskIntoConstraints = false

        view.addSubview(progressView)
        NSLayoutConstraint.activate([
            progressView.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor),
            progressView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            progressView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            progressView.heightAnchor.constraint(equalToConstant: 3)
        ])
    }

    private func setupRefreshControl() {
        refreshControl = UIRefreshControl()
        refreshControl.tintColor = UIColor(red: 12/255, green: 131/255, blue: 31/255, alpha: 1.0)
        refreshControl.addTarget(self, action: #selector(handleRefresh), for: .valueChanged)
        webView.scrollView.addSubview(refreshControl)
    }

    @objc private func handleRefresh() {
        webView.reload()
    }

    private func loadStorefront() {
        // Points to deployed store URL or local server
        if let url = URL(string: "https://RasoeeFresh.com") {
            let request = URLRequest(url: url)
            webView.load(request)
        }
    }

    // Observer for Progress Bar
    override func observeValue(forKeyPath keyPath: String?, of object: Any?, change: [NSKeyValueChangeKey : Any]?, context: UnsafeMutableRawPointer?) {
        if keyPath == "estimatedProgress" {
            progressView.progress = Float(webView.estimatedProgress)
            progressView.isHidden = webView.estimatedProgress >= 1.0
        }
    }

    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        refreshControl.endRefreshing()
    }

    // Intercept WhatsApp & UPI Schemes
    func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        guard let url = navigationAction.request.url else {
            decisionHandler(.allow)
            return
        }

        let urlString = url.absoluteString

        // 1. WhatsApp Redirection (wa.me, api.whatsapp.com, whatsapp://)
        if urlString.contains("wa.me") || urlString.contains("api.whatsapp.com") || urlString.starts(with: "whatsapp://") {
            if UIApplication.shared.canOpenURL(url) {
                UIApplication.shared.open(url, options: [:], completionHandler: nil)
                decisionHandler(.cancel)
                return
            } else {
                let alert = UIAlertController(title: "WhatsApp Not Installed", message: "Please install WhatsApp to place express grocery orders.", preferredStyle: .alert)
                alert.addAction(UIAlertAction(title: "OK", style: .default))
                present(alert, animated: true)
                decisionHandler(.cancel)
                return
            }
        }

        // 2. UPI Payment Scheme
        if urlString.starts(with: "upi://") || urlString.starts(with: "tez://") || urlString.starts(with: "phonepe://") || urlString.starts(with: "paytmmp://") {
            if UIApplication.shared.canOpenURL(url) {
                UIApplication.shared.open(url, options: [:], completionHandler: nil)
                decisionHandler(.cancel)
                return
            }
        }

        decisionHandler(.allow)
    }

    deinit {
        webView.removeObserver(self, forKeyPath: #keyPath(WKWebView.estimatedProgress))
    }
}
