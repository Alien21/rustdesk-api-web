import { defineConfig } from 'vite'
import * as path from 'path'
import * as dotenv from 'dotenv'
import * as fs from 'fs'
import vue from '@vitejs/plugin-vue'

const projectRoot = fs.realpathSync(__dirname)

const centralArtifacts = process.env.RUSTDESK_ARTIFACTS_DIR
let artifactNamespace
if (centralArtifacts) {
  if (!path.isAbsolute(centralArtifacts)) {
    throw new Error('RUSTDESK_ARTIFACTS_DIR must be an absolute central directory')
  }
  artifactNamespace = path.join(path.resolve(centralArtifacts), 'rustdesk-api-web')
}

function centralArtifactPath (...parts) {
  const destination = path.join(artifactNamespace, ...parts)
  let existing = destination
  for (let current = destination; ; current = path.dirname(current)) {
    let info
    try {
      info = fs.lstatSync(current)
    } catch (error) {
      if (error.code !== 'ENOENT') throw error
    }
    if (info && (info.isSymbolicLink() || !info.isDirectory())) {
      throw new Error(`Refusing redirected artifact directory: ${current}`)
    }
    if (path.dirname(current) === current) break
  }
  while (!fs.existsSync(existing)) {
    const parent = path.dirname(existing)
    if (parent === existing) {
      throw new Error(`Artifact filesystem root is unavailable: ${existing}`)
    }
    existing = parent
  }
  const canonical = path.resolve(fs.realpathSync.native(existing), path.relative(existing, destination))
  const source = fs.realpathSync.native(projectRoot)
  const inside = (parent, value) => {
    const relative = path.relative(parent, value)
    return relative === '' || (relative !== '..' && !relative.startsWith('..' + path.sep) && !path.isAbsolute(relative))
  }
  if (inside(source, canonical) || inside(canonical, source)) {
    throw new Error('Central build outputs must be separate from the source directory')
  }
  return destination
}

const viteCache = artifactNamespace
  ? centralArtifactPath('cache', 'vite', `${process.platform}-${process.arch}`)
  : 'artifacts/cache/vite'
const webOutput = artifactNamespace
  ? centralArtifactPath('publish', 'web')
  : 'artifacts/publish/web'

const NODE_ENV = process.env.NODE_ENV || 'development'
const envFile = path.join(projectRoot, `.env.${NODE_ENV}`)
const envConfig = dotenv.parse(fs.readFileSync(envFile))
for (const k in envConfig) {
  process.env[k] = envConfig[k]
}

let alias = {
  '@': path.resolve(projectRoot, './src'),
  'vue$': 'vue/dist/vue.runtime.esm-bundler.js',
}

const conf = {
  cacheDir: viteCache,
  base: './', // index.html文件所在位置
  root: projectRoot, // js导入的资源路径，src
  server: {
    open: true,
    port: process.env.VITE_DEV_PORT,
    proxy: {
      [process.env.VITE_SERVER_API]: {
        target: process.env.VITE_SERVER_PATH,
        // rewrite: path => path.replace(/^\/api/, '/api'), //为了模拟
        changeOrigin: true,
      },
    },
  },
  build: {
    target: 'es2020',
    minify: 'esbuild', // 是否进行压缩,boolean | 'terser' | 'esbuild',默认使用 esbuild
    manifest: false, // 是否产出maifest.json
    sourcemap: false, // 是否产出soucemap.json
    emptyOutDir: true,
    outDir: webOutput, // 产出目录
    rollupOptions: {
      output: {
        manualChunks (id) {
          if (id.includes('node_modules')) {
            const arr = id.toString().split('node_modules/')[1].split('/')
            switch (arr[0]) {
              case '@popperjs':
              case '@vue':
              case 'axios':
              case 'element-plus':
              case '@element-plus':
                return '_' + arr[0]
              default :
                return '__vendor'
            }
          }else if(id.includes('Gwen-admin/src')){
            //src 下的都打包到一起 不然很多小文件
            return 'gwen'
          }
        },
        chunkFileNames: 'static/chunk/[name]-[hash].js',
        entryFileNames: 'static/entry/[name]-[hash].js',
        assetFileNames: 'static/[ext]/[name]-[hash].[ext]'
      },
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        javascriptEnabled: true,
      },
    },
  },
  resolve: {
    alias,
  },
  plugins: [
    vue(),
  ],
}

// https://vitejs.dev/config/
export default defineConfig(conf)
