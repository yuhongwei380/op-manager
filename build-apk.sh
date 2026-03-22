#!/usr/bin/env bash

# 出错时自动停止执行
set -e

echo "==========================================="
echo "        Op-Manager Android 打包脚本        "
echo "==========================================="

# 读取 app.json 中的 version 字段
VERSION=$(node -p "require('./app.json').expo.version")

if [ -z "$VERSION" ] || [ "$VERSION" = "undefined" ]; then
    echo "❌ 无法从 app.json 中读取版本号！"
    exit 1
fi

echo "📦 获取到版本号: v$VERSION"

echo "🧹 [1/5] 清理旧版本 APK 产物..."
rm -f op-manager-*.apk

echo "▶️ [2/5] 安装依赖 (npm install)..."
npm install

echo "▶️ [3/5] 生成原生目录 (expo prebuild)..."
CI=1 npx expo prebuild --platform android --clean

echo "▶️ [4/5] 编译 Release APK..."
cd android
chmod +x ./gradlew
./gradlew assembleRelease
cd ..

echo "▶️ [5/5] 提取并重命名 APK 文件..."
APK_PATH="android/app/build/outputs/apk/release/app-release.apk"

if [ -f "$APK_PATH" ]; then
    NEW_MOD_NAME="op-manager-${VERSION}.apk"
    cp "$APK_PATH" "./$NEW_MOD_NAME"
    echo "✅ APK 导出成功: $NEW_MOD_NAME"
else
    # 兼容处理，万一名叫 apk-release.apk 或别名
    ALT_APK_PATH=$(find android/app/build/outputs/apk/release/ -name "*.apk" | head -n 1)
    if [ -n "$ALT_APK_PATH" ] && [ -f "$ALT_APK_PATH" ]; then
        NEW_MOD_NAME="op-manager-${VERSION}.apk"
        cp "$ALT_APK_PATH" "./$NEW_MOD_NAME"
        echo "✅ APK 导出成功: $NEW_MOD_NAME"
    else
        echo "❌ 错误: 未能在 $APK_PATH 找到生成的 APK 文件！"
    fi
fi

echo "🧹 正在清理原生目录和依赖目录..."
rm -rf android
rm -rf node_modules
rm -rf .expo
rm -f expo-env.d.ts

echo "🎉 打包完成！"
