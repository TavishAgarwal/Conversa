1:"$Sreact.fragment"
2:I[42593,["177","static/chunks/app/layout-27fbf15604f15dca.js"],""]
4:I[57121,[],""]
5:I[74581,[],""]
6:I[84317,["177","static/chunks/app/layout-27fbf15604f15dca.js"],"Analytics"]
:HL["/_next/static/css/081a0afca5a9bd20.css","style"]
:HL["/_next/static/css/0a82ff40d702da8e.css","style"]
3:T7d5,
              (function() {
                console.log('[WASMPreloader] Starting module pre-load...');
                
                const modules = [
                  { url: '/assets/racommons-llamacpp.js', global: '__llamacpp_cpu__', name: 'LlamaCpp CPU' },
                  { url: '/assets/racommons-llamacpp-webgpu.js', global: '__llamacpp_webgpu__', name: 'LlamaCpp WebGPU' },
                  { url: '/assets/sherpa/sherpa-onnx-glue.js', global: '__sherpa_onnx__', name: 'Sherpa ONNX' },
                ];
                
                async function loadModule(mod) {
                  try {
                    console.log('[WASMPreloader] Fetching ' + mod.name + '...');
                    const response = await fetch(mod.url);
                    if (!response.ok) throw new Error('HTTP ' + response.status);
                    
                    const code = await response.text();
                    const blob = new Blob([code], { type: 'application/javascript' });
                    const blobURL = URL.createObjectURL(blob);
                    
                    const module = await import(blobURL);
                    window[mod.global] = module.default || module;
                    
                    console.log('[WASMPreloader] ' + mod.name + ' loaded ✓');
                  } catch (error) {
                    console.error('[WASMPreloader] Failed to load ' + mod.name + ':', error);
                    throw error;
                  }
                }
                
                Promise.all(modules.map(loadModule))
                  .then(() => {
                    console.log('[WASMPreloader] All modules pre-loaded ✓');
                    window.__WASM_MODULES_READY__ = true;
                  })
                  .catch((error) => {
                    console.error('[WASMPreloader] Pre-load failed:', error);
                    window.__WASM_MODULES_ERROR__ = error.message;
                  });
              })();
            0:{"rsc":["$","$1","c",{"children":[[["$","link","0",{"rel":"stylesheet","href":"/_next/static/css/081a0afca5a9bd20.css","precedence":"next"}],["$","link","1",{"rel":"stylesheet","href":"/_next/static/css/0a82ff40d702da8e.css","precedence":"next"}]],["$","html",null,{"lang":"en","className":"dark","children":[["$","head",null,{"children":["$","$L2",null,{"id":"wasm-preloader","strategy":"beforeInteractive","dangerouslySetInnerHTML":{"__html":"$3"}}]}],["$","body",null,{"className":"__variable_f367f3 font-sans antialiased bg-background text-foreground","children":[["$","$L4",null,{"parallelRouterKey":"children","template":["$","$L5",null,{}]}],["$","$L6",null,{}]]}]]}]]}],"isPartial":false,"staleTime":300,"varyParams":null,"buildId":"8f9AMfBFvEuzOhEkb6UIi"}
