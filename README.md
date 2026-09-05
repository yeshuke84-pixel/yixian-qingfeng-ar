# 《一线清风》摄像头纸雕地图

这是不依赖图像识别的第一阶段版本：打开摄像头后，用户主动放置古村纸雕地图，再通过手势操作和点击建筑进入地点。

## 运行

```powershell
cd D:\一线清风-AR古村地图
npm install
npm run dev:https
```

手机必须使用可信 HTTPS 地址，电脑与手机本地测试时需连接同一 Wi-Fi。

## 当前功能

- 原生 `getUserMedia` 摄像头实时画面
- 点击“放置鸢尾岭”显示地图
- 戏台、神龛室、廊桥桥廊、织造坊依次翻起
- 单指拖动、双指缩放、双指旋转
- 桌面鼠标拖动与滚轮缩放
- 地点信息卡与“正在进入该地点”过渡层

## 修改位置

- 地点坐标、文案和裁切范围：`src/data/locations.js`
- 摄像头：`src/camera.js`
- 手势：`src/gestures.js`
- 纸雕建筑生成：`src/paperMap.js`
- UI 和流程：`src/main.js`
- 视觉与翻起动画：`src/style.css`

地点数据中的 `image` 目前为 `null`，表示从原地图精确裁切显示。以后把它改成 `/assets/buildings/xxx.png`，即可替换为独立透明 PNG。
