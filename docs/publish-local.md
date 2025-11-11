# Local dry-run for publish workflow

This document explains how to simulate the key steps of the publish workflow locally: packing packages and optionally signing the generated tarballs.

Prerequisites

- Node.js and npm
- `gpg` CLI if you want to test GPG signing
- `cosign` CLI cannot perform keyless OIDC signing locally (requires GitHub Actions OIDC). You can test `cosign` signing with a locally-provided key if desired.

Pack changed packages (example: pack all packages)

From the repo root, run PowerShell:

    npm run build
    for ($p in Get-ChildItem packages -Directory) { pushd $p.FullName; npm pack; popd }

# tarballs will be created under each package folder

Collect tarballs to a temp folder

    mkdir tmp\publish-assets
    Get-ChildItem packages -Recurse -Filter *.tgz | ForEach-Object { Copy-Item $_.FullName tmp\publish-assets }

GPG sign tarballs (optional)

    # Import your key (ASCII-armored file)
    gpg --import my-private-key.asc

    # Sign each tarball
    Get-ChildItem tmp\publish-assets -Filter *.tgz | ForEach-Object { gpg --batch --yes --passphrase "$env:GPG_PASSPHRASE" --output ($_.FullName + '.sig') --detach-sign $_.FullName }

Cosign keyless signing note

Keyless cosign signing uses OIDC and only works inside GitHub Actions. To test cosign locally use a key pair and run `cosign sign-blob --key cosign.key <file>` after generating keys.

    # generate a key pair (not keyless)
    cosign generate-key-pair
    cosign sign-blob --key cosign.key my-package.tgz

After a successful dry run you can inspect the generated tarballs and signatures in `tmp/publish-assets`.
