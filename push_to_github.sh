#!/bin/bash

# GitHub Personal Access Tokenを引数として受け取る
if [ $# -eq 0 ]; then
    echo "使用方法: ./push_to_github.sh <your_personal_access_token>"
    echo "例: ./push_to_github.sh ghp_xxxxxxxxxxxxxxxxxxxx"
    exit 1
fi

TOKEN=$1

# リモートURLを一時的にトークン付きに変更してプッシュ
git remote set-url origin https://${TOKEN}@github.com/gegege1566/population-pyramid-app.git
git push origin main

# セキュリティのためリモートURLを元に戻す
git remote set-url origin https://github.com/gegege1566/population-pyramid-app.git

echo "✅ GitHubへのプッシュが完了しました！"