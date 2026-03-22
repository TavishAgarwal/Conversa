/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  // Required headers for SharedArrayBuffer support (needed for WASM)
  async headers() {
    return [
      {
        source: '/assets/racommons-llamacpp-webgpu.wasm',
        headers: [{ key: 'Content-Type', value: 'application/wasm' }],
      },
      {
        source: '/assets/racommons-llamacpp.wasm',
        headers: [{ key: 'Content-Type', value: 'application/wasm' }],
      },
      {
        source: '/assets/sherpa/sherpa-onnx.wasm',
        headers: [{ key: 'Content-Type', value: 'application/wasm' }],
      },
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'credentialless',
          },
        ],
      },
    ];
  },
  // Webpack configuration for WASM support
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Enable WebAssembly
      config.experiments = {
        ...config.experiments,
        asyncWebAssembly: true,
        layers: true,
      };

      // Add rule for .wasm files
      config.module.rules.push({
        test: /\.wasm$/,
        type: 'asset/resource',
      });
    }
    
    return config;
  },
}

export default nextConfig
