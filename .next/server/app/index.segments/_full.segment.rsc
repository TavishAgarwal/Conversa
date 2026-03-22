1:"$Sreact.fragment"
2:I[42593,["177","static/chunks/app/layout-27fbf15604f15dca.js"],""]
4:I[57121,[],""]
5:I[74581,[],""]
a:I[27123,[],"default",1]
:HL["/_next/static/media/e4af272ccee01ff0-s.p.woff2","font",{"crossOrigin":"","type":"font/woff2"}]
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
            0:{"P":null,"c":["",""],"q":"","i":false,"f":[[["",{"children":["__PAGE__",{}]},"$undefined","$undefined",16],[["$","$1","c",{"children":[[["$","link","0",{"rel":"stylesheet","href":"/_next/static/css/081a0afca5a9bd20.css","precedence":"next","crossOrigin":"$undefined","nonce":"$undefined"}],["$","link","1",{"rel":"stylesheet","href":"/_next/static/css/0a82ff40d702da8e.css","precedence":"next","crossOrigin":"$undefined","nonce":"$undefined"}]],["$","html",null,{"lang":"en","className":"dark","children":[["$","head",null,{"children":["$","$L2",null,{"id":"wasm-preloader","strategy":"beforeInteractive","dangerouslySetInnerHTML":{"__html":"$3"}}]}],["$","body",null,{"className":"__variable_f367f3 font-sans antialiased bg-background text-foreground","children":[["$","$L4",null,{"parallelRouterKey":"children","error":"$undefined","errorStyles":"$undefined","errorScripts":"$undefined","template":["$","$L5",null,{}],"templateStyles":"$undefined","templateScripts":"$undefined","notFound":[[["$","title",null,{"children":"404: This page could not be found."}],["$","div",null,{"style":{"fontFamily":"system-ui,\"Segoe UI\",Roboto,Helvetica,Arial,sans-serif,\"Apple Color Emoji\",\"Segoe UI Emoji\"","height":"100vh","textAlign":"center","display":"flex","flexDirection":"column","alignItems":"center","justifyContent":"center"},"children":["$","div",null,{"children":[["$","style",null,{"dangerouslySetInnerHTML":{"__html":"body{color:#000;background:#fff;margin:0}.next-error-h1{border-right:1px solid rgba(0,0,0,.3)}@media (prefers-color-scheme:dark){body{color:#fff;background:#000}.next-error-h1{border-right:1px solid rgba(255,255,255,.3)}}"}}],["$","h1",null,{"className":"next-error-h1","style":{"display":"inline-block","margin":"0 20px 0 0","padding":"0 23px 0 0","fontSize":24,"fontWeight":500,"verticalAlign":"top","lineHeight":"49px"},"children":404}],"$L6"]}]}]],[]],"forbidden":"$undefined","unauthorized":"$undefined"}],"$L7"]}]]}]]}],{"children":["$L8",{},null,false,null]},null,false,null],"$L9",false]],"m":"$undefined","G":["$a",[]],"S":true,"h":null,"s":"$undefined","l":"$undefined","p":"$undefined","d":"$undefined","b":"8f9AMfBFvEuzOhEkb6UIi"}
b:I[84317,["177","static/chunks/app/layout-27fbf15604f15dca.js"],"Analytics"]
c:I[61304,[],"ClientPageRoot"]
d:I[6137,["298","static/chunks/298-742461e2359c7b01.js","974","static/chunks/app/page-a3463235f5f25272.js"],"default"]
10:I[90484,[],"OutletBoundary"]
11:"$Sreact.suspense"
13:I[90484,[],"ViewportBoundary"]
15:I[90484,[],"MetadataBoundary"]
6:["$","div",null,{"style":{"display":"inline-block"},"children":["$","h2",null,{"style":{"fontSize":14,"fontWeight":400,"lineHeight":"49px","margin":0},"children":"This page could not be found."}]}]
7:["$","$Lb",null,{}]
8:["$","$1","c",{"children":[["$","$Lc",null,{"Component":"$d","serverProvidedParams":{"searchParams":{},"params":{},"promises":["$@e","$@f"]}}],null,["$","$L10",null,{"children":["$","$11",null,{"name":"Next.MetadataOutlet","children":"$@12"}]}]]}]
9:["$","$1","h",{"children":[null,["$","$L13",null,{"children":"$L14"}],["$","div",null,{"hidden":true,"children":["$","$L15",null,{"children":["$","$11",null,{"name":"Next.Metadata","children":"$L16"}]}]}],["$","meta",null,{"name":"next-size-adjust","content":""}]]}]
e:{}
f:"$8:props:children:0:props:serverProvidedParams:params"
14:[["$","meta","0",{"charSet":"utf-8"}],["$","meta","1",{"name":"viewport","content":"width=device-width, initial-scale=1"}],["$","meta","2",{"name":"theme-color","content":"#0B0F19"}]]
12:null
16:[["$","title","0",{"children":"Conversa — Offline Voice AI"}],["$","meta","1",{"name":"description","content":"A fully offline, voice-first AI assistant that runs entirely in your browser. Private by design."}],["$","meta","2",{"name":"generator","content":"v0.app"}]]
