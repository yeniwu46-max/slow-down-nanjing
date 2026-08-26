# MindAR 目标图编译

将立牌/海报 PNG 编译为 `.mind` 目标文件，供 Image Tracking 使用。

## 前置条件

- Node.js 18+
- 在 Windows 上编译需要安装 [node-canvas 依赖](https://github.com/Automattic/node-canvas#compiling)（GTK、Visual Studio Build Tools）

若本地无法编译，可使用 [MindAR 在线编译工具](https://hiukim.github.io/mind-ar-js-doc/tools/compile) 上传 `public/markers/xuanwu-lake-poster.png`，下载后保存为 `public/targets/xuanwu-lake.mind`。

## 命令

```bash
npx mind-ar-js-image-compiler ./public/markers/xuanwu-lake-poster.png -o ./public/targets/xuanwu-lake.mind
```

## 开发说明

当前仓库中的 `xuanwu-lake.mind` 基于 MindAR 官方 card 示例目标，用于本地联调。正式部署前，**必须**用玄武湖立牌海报重新编译，否则识别图案与现场立牌不一致。

开发测试可使用 `public/markers/dev-card-reference.png` 对准相机，或点击扫描页的「演示模式」跳过识别。
