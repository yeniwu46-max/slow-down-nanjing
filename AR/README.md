# 宁可慢一点 · AR 子项目

独立 Vite 应用，默认 **http://localhost:3006**。

```bash
npm install --ignore-scripts
npm run dev
```

完整架构见 [`AR_ARCHITECTURE.md`](./AR_ARCHITECTURE.md)。

## 快速体验

1. 主站地图点击「玄武湖 AR 打卡」，或直接打开 `/scan?spot=xuanwu-lake`
2. 扫描页可使用「演示模式」跳过识别
3. 手势阶段可按键盘 `1–4` 模拟四种手势

## 环境变量

复制 `.env.example` 为 `.env`：

```
VITE_WEB_BASE_URL=http://localhost:3005
```

主站需配置 `NEXT_PUBLIC_AR_BASE_URL=http://localhost:3006`。
