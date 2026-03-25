# OpenWrt Manager

一款用于管理多个 OpenWrt 路由器节点的安卓应用，基于 React Native (Expo) 构建。

---

## 功能介绍

- ✅ **节点管理** — 添加、编辑、删除 OpenWrt 连接（支持 HTTP/HTTPS，持久化本地保存）
- ✅ **主机概览** — 查看 CPU 使用率、内存剩余、系统负载（1m/5m/15m）
- ✅ **OpenClash Dashboard** — 内嵌 Zashboard 面板，管理代理节点和规则
- ✅ **OpenClash Config** — 内嵌 LuCI OpenClash 配置页面，支持运行状态、配置订阅、覆写设置等
- ✅ **自动登录** — 打开 LuCI 配置页时，使用保存的账号密码自动填充并提交登录表单

---

## 项目结构

```
openwrt/
├── App.tsx                         # 应用入口，导航配置
├── app.json                        # Expo 应用配置（包名、图标等）
├── eas.json                        # EAS 云端打包配置
├── src/
│   ├── types.ts                    # TypeScript 类型定义
│   ├── storage.ts                  # 本地存储（AsyncStorage CRUD）
│   ├── api.ts                      # OpenWrt ubus/LuCI API 封装
│   └── screens/
│       ├── HomeScreen.tsx          # 节点列表主页
│       ├── AddNodeScreen.tsx       # 添加/编辑节点表单
│       ├── NodeDashboardScreen.tsx # 节点概览（CPU/内存/负载/服务入口）
│       ├── OpenClashScreen.tsx     # OpenClash Yacd 面板（WebView）
│       └── OpenClashConfigScreen.tsx # OpenClash LuCI 配置页面（WebView）
└── assets/                        # 图标、启动图等资源文件
```

---

## 本地开发调试

### 环境要求

| 工具 | 版本要求 | 安装方式 |
|---|---|---|
| Node.js | >= 18 | [nodejs.org](https://nodejs.org) |
| npm | >= 9 | 随 Node.js 安装 |
| Expo Go（手机） | 最新版 | 在手机应用商店搜索"Expo Go"安装 |

### 启动开发服务

```bash
# 1. 进入项目目录
cd ~/Desktop/openwrt

# 2. 安装依赖（首次或依赖更新后执行）
npm install

# 3. 启动 Expo 开发服务（自动打开浏览器控制台）
npm start
# 或者
npx expo start

# 如果出现缓存问题导致热更新不生效，加 -c 清除缓存启动
npx expo start -c
```

### 在手机上预览

1. 确保手机和 Mac **连接同一个 WiFi 网络**
2. 打开手机上安装的 **Expo Go** App
3. 用 Expo Go 扫描终端中显示的 **二维码**
4. App 即会在手机上实时渲染

### 热更新

代码保存后，Expo Go 会自动刷新（Hot Reload）。若需强制全量重载：
- 在终端按 `r` 键
- 或在手机上摇一摇，点击 **Reload**

### 查看日志/错误

- **终端控制台** — 所有 `console.log/warn` 输出显示在 Expo 终端
- **手机红屏** — 只有 `console.error` 才会触发红屏弹框（已做过静默处理，正常使用不会出现）
- **按 `j` 键** — 在终端按 j 可打开 Chrome DevTools 进行断点调试

---

## 构建正式 Android APK

> **说明**：以下方式可产出可直接安装到安卓手机的 `.apk` 文件。

---


### 方案 A：🖥️ 本地构建（完全离线，需安装 Android Studio）

**优点**：不依赖 Expo 服务器，适合频繁迭代或内网环境。

#### 第一步：安装 Android Studio

1. 访问 [https://developer.android.com/studio](https://developer.android.com/studio) 下载并安装
2. 打开 Android Studio → **SDK Manager**（顶部菜单 Tools → SDK Manager）
3. 勾选 **Android 14.0 (API 34)** SDK 并点击 Apply 安装

#### 第二步：配置环境变量

编辑 `~/.zshrc`（如使用 bash 则是 `~/.bash_profile`）：

```bash
# 追加以下两行（路径一般是 ~/Library/Android/sdk）
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/tools

# 重新加载配置
source ~/.zshrc

# 验证是否生效
adb --version
```

#### 第三步：生成原生 Android 工程

```bash
cd ~/Desktop/openwrt

# 生成 android/ 原生目录（--clean 会清除旧的原生代码重新生成）
npx expo prebuild --platform android --clean
```

#### 第四步：构建 Release APK

```bash
cd ~/Desktop/openwrt/android

# 赋予 gradlew 执行权限（首次执行）
chmod +x ./gradlew

# 构建 release APK（首次编译约 5~10 分钟）
./gradlew assembleRelease
```

#### APK 输出路径

```
~/Desktop/openwrt/android/app/build/outputs/apk/release/app-release.apk
```

> **提示**：无签名的 Release APK 可以直接安装，但如需上架应用商店则需要配置签名密钥。

#### 安装到手机（数据线方式）

```bash
# 手机开启"开发者模式"+"USB调试"，连接到Mac后执行：
adb install ~/Desktop/openwrt/android/app/build/outputs/apk/release/app-release.apk
```

---

## 更新图标或原生配置后的重新打包流程

> ⚠️ **重要**：当修改以下内容后，必须执行完整的 clean + prebuild + 重新编译，否则改动不会生效：
> - `app.json` 中的图标路径（`icon`、`adaptiveIcon`、`splash`）
> - `app.json` 中的包名、版本号、权限配置
> - `assets/` 目录下的图标文件内容

### 完整重新打包步骤

```bash
cd ~/Desktop/openwrt

# 第1步：清除旧的原生目录，用最新 app.json 重新生成 android/ 目录
# ⚠️ --clean 会删除整个 android/ 目录并重建，local.properties 也会被清除
npx expo prebuild --platform android --clean

# 第2步：重新写入 Android SDK 路径（每次 --clean 后必须执行）
echo "sdk.dir=$HOME/Library/Android/sdk" > android/local.properties

# 第3步：重新构建 APK
cd android
./gradlew assembleRelease
```

> 💡 **为什么每次 `--clean` 后都要重写 `local.properties`？**
> 因为 `--clean` 参数会完整删除整个 `android/` 目录（包括其中的 `local.properties`），
> 然后重新生成，所以每次执行后都需要重新告诉 Gradle 你的 SDK 在哪里。
> 你也可以把 `sdk.dir` 配置写到全局环境变量 `ANDROID_HOME` 中来避免每次手动写入。

---

## 修改输出 APK 的文件名

默认情况下，Gradle 输出的 APK 文件名为 `app-release.apk`。有两种方式改变它：

### 方式一：构建完成后直接重命名（最简单）

```bash
# 构建完成后执行（替换成你想要的名字）
mv ~/Desktop/openwrt/android/app/build/outputs/apk/release/app-release.apk \
   ~/Desktop/openwrt/android/app/build/outputs/apk/release/openwrt-manager.apk
```

---

### 方式二：修改 Gradle 配置，让构建直接输出正确文件名

编辑 `android/app/build.gradle`，在 `android { }` 块内添加以下内容：

```gradle
android {
    // ... 已有的其他配置 ...

    // 自定义输出 APK 文件名
    applicationVariants.all { variant ->
        variant.outputs.all { output ->
            outputFileName = "openwrt-manager-${variant.versionName}.apk"
            // 例如输出: openwrt-manager-1.0.0.apk
        }
    }
}
```

修改后重新执行 `./gradlew assembleRelease`，APK 就会以新名字输出。

> ⚠️ **注意**：`android/app/build.gradle` 是自动生成文件。
> 每次执行 `npx expo prebuild --clean` 后这个文件会被重置，需要重新添加上述配置。
> 因此**推荐使用方式一**（构建后 `mv` 重命名），更简单也无需担心被覆盖。

---

## 注意事项

### HTTP 局域网访问（重要）

本 App 需要连接局域网 HTTP 路由器（非 HTTPS），在正式 APK 中 Android 默认禁止明文 HTTP 请求。
已在 `app.json` 中配置 `"usesCleartextTraffic": true` 解除此限制，无需额外操作。

### OpenClash API 端口

- **Yacd 面板** 默认访问端口为 `9090`（OpenClash Meta 内核默认配置）
- 如您修改过 clash 的 API 端口，需相应调整 `OpenClashScreen.tsx` 和 `OpenClashConfigScreen.tsx` 中的端口号

### System Load 换算

OpenWrt ubus 返回的 `load` 为 Linux 内核定点整数格式（× 65536），App 已自动换算为标准负载均值显示（如 `0.24 / 0.18 / 0.10`）。

---

## 常见问题

| 问题 | 原因 | 解决方案 |
|---|---|---|
| Dashboard 统计数据显示 N/A | 路由器未开放 ubus/LuCI RPC 接口 | 安装 `rpcd` 和 `luci-mod-rpc` 包 |
| OpenClash Config 打开后空白 | OpenClash 未安装或路由器端口不对 | 确认已安装 OpenClash 插件 |
| LuCI 页面未自动登录 | 密码含特殊字符 | 在节点编辑中重新保存密码 |
| 热更新不生效 | Expo 缓存问题 | 执行 `npx expo start -c` |
| 构建 APK 时 Gradle 失败 | Java 版本不兼容 | 确认 Java 17 或 21（`java -version`）|
| 修改图标后 APK 里图标没变 | android/ 目录缓存了旧图标 | 执行 `npx expo prebuild --platform android --clean` 重新生成后再构建 |
| prebuild --clean 后 Gradle 报 SDK 找不到 | --clean 删除了 local.properties | 执行 `echo "sdk.dir=$HOME/Library/Android/sdk" > android/local.properties` |

