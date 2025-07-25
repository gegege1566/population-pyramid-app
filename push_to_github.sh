#!/bin/bash
# GitHubにプッシュするスクリプト
# 使い方: ./push_to_github.sh あなたのトークン

TOKEN=$1

if [ -z "$TOKEN" ]; then
    echo "使い方: ./push_to_github.sh ghp_あなたのトークン"
    echo "例: ./push_to_github.sh ghp_ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefgh"
    exit 1
fi

echo "GitHubにプッシュしています..."
git push https://gegege1566:${TOKEN}@github.com/gegege1566/population-pyramid-app.git main

if [ $? -eq 0 ]; then
    echo "✅ プッシュ成功！"
    echo "GitHubで確認: https://github.com/gegege1566/population-pyramid-app"
else
    echo "❌ プッシュ失敗。トークンを確認してください。"
fi