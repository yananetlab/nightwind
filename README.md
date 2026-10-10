# Nightwind / 晚风不记得

一个不登录、不保存、不上传的深夜碎碎念角落。输入的文字只存在于当前页面内存中，交给晚风后立即清空。

## 本地开发

```bash
npm install
npm run dev
```

## 构建

```bash
npm run build
npm run preview
```

## 项目结构

- `src/features/release.js`：文字消散体验
- `src/features/music.js`：浏览器本地生成的氛围音乐
- `src/features/privacy.js`：隐私说明交互
- `src/styles.css`：页面视觉与响应式布局
- `public/`：无需构建处理的静态资源

后续主题切换功能将作为独立 feature 模块接入。

## 隐私原则

- 不使用 Cookie、localStorage、IndexedDB 或第三方 API
- 不上传、保存或分析用户输入
- 背景音乐由浏览器本地生成，不加载外部音频或录音
- 刷新、离开页面或完成消散后立即清空文字

部署地址：<https://yananetlab.github.io/nightwind/>
