# Third-party libraries, models and fonts

PocketTool uses the following open-source work. Each keeps its own licence. The desktop builds bundle these files in the `offline` folder; the browser version downloads them when first needed.

## Libraries

| What | Used for | Licence |
| --- | --- | --- |
| [PDF.js](https://github.com/mozilla/pdf.js) 3.11.174 (Mozilla) | Reading and showing PDFs | Apache 2.0 |
| [pdf-lib](https://github.com/Hopding/pdf-lib) 1.17.1 | Editing PDFs | MIT |
| [JSZip](https://github.com/Stuk/jszip) 3.10.1 | Making ZIP files | MIT (dual-licensed MIT or GPLv3; used under MIT) |
| [heic2any](https://github.com/alexcorvi/heic2any) 0.0.4 | Opening iPhone HEIC photos | MIT; includes libheif, LGPL 3.0 |
| [TensorFlow.js](https://github.com/tensorflow/tfjs) 4.22.0 | Running the AI upscaler | Apache 2.0 |
| [UpscalerJS](https://github.com/thekevinscott/UpscalerJS) 1.0.0-beta.19 | AI upscaling | MIT |
| [Transformers.js](https://github.com/huggingface/transformers.js) 3.5.1 | Running the background remover | Apache 2.0 |
| [ONNX Runtime Web](https://github.com/microsoft/onnxruntime) | AI engine used by Transformers.js | MIT |
| [ffmpeg.wasm](https://github.com/ffmpegwasm/ffmpeg.wasm) 0.12.10 | Video and audio tools | MIT |
| [@ffmpeg/core](https://github.com/ffmpegwasm/ffmpeg.wasm) 0.12.6, a WebAssembly build of [FFmpeg](https://ffmpeg.org) | The video engine | **GPL 2.0 or later**, because it includes x264. Its source code is available from the ffmpeg.wasm and FFmpeg projects. |
| [Electron](https://www.electronjs.org) 33 | The desktop app | MIT; includes Chromium and other components under their own licences |

## AI models

| Model | Used for | Licence |
| --- | --- | --- |
| [ESRGAN Slim](https://github.com/thekevinscott/UpscalerJS/tree/main/models/esrgan-slim) 2× and 4× | Resize & upscale, AI method | MIT |
| [BiRefNet](https://github.com/ZhengPeng7/BiRefNet), versions rebuilt for graphics cards by [wonfy](https://huggingface.co/wonfy/BiRefNet-ONNX-webgpu) (pinned to commit 041c6b2) | Remove background, "Best quality" | MIT. **Note:** BiRefNet was trained partly on the DIS5K dataset, whose own terms restrict commercial use. The MIT licence covers the model and code, not the training data. |
| [BiRefNet Lite](https://github.com/ZhengPeng7/BiRefNet), rebuilt by [wonfy](https://huggingface.co/wonfy/BiRefNet_lite-ONNX-webgpu) (pinned to commit c40eaa2) | Remove background, "Standard" | MIT, with the same DIS5K training-data note |
| [MODNet](https://github.com/ZHKKKe/MODNet), via [Xenova/modnet](https://huggingface.co/Xenova/modnet) | Remove background, "People, quick" | Apache 2.0 |

## Fonts

[Instrument Sans](https://fonts.google.com/specimen/Instrument+Sans), [Caveat](https://fonts.google.com/specimen/Caveat), [Dancing Script](https://fonts.google.com/specimen/Dancing+Script) and [Great Vibes](https://fonts.google.com/specimen/Great+Vibes), all under the SIL Open Font License 1.1.

## Data

UK bank holiday dates from [GOV.UK](https://www.gov.uk/bank-holidays), under the [Open Government Licence v3.0](https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/). PocketTool also works them out from the published rules when offline.
