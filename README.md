# Auto login with device code

A small service that uses puppeteer to log into your auth0 account and confirms a "device code flow" session.
Useful for tvOS xcuitests, which doesn't allow any webviews, and manually sending all the network requests is tedious.

## Quick install on google cloud run

It's going to be practically free to host it on cloud run if you scale to 0.
Just run `gcloud run deploy` (select allow unauthenticated) and add the env variables (see .env.example) and you are good to go 👍

## Usage

```
POST /confirm?user_code=SOME-CODE&api_key=abc123
```

## Usage in appletv tests:

```swift

private func loginUserWithDeviceCode(deviceCode: String) async -> Bool {
    guard let apiKey = ProcessInfo.processInfo.environment["LOGIN_API_KEY"] else {
        debugPrint("no api key!!")
        return false
    }

    guard let url = URL(string: "https://your-url/confirm?user_code=\(deviceCode)&api_key=\(apiKey)") else { return false }
    var request = URLRequest(url: url)
    request.httpMethod = "POST"

    do {
        let (_, response) = try await URLSession.shared.data(for: request)
        guard let httpResponse = response as? HTTPURLResponse, httpResponse.statusCode == 200 else { return false }
        return true
    } catch {
        return false
    }
}

```
