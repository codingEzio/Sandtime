# Sandtime

<p><img src="docs/icon.svg" width="96" height="96" alt="Sandtime"></p>

[English](README.md) · [简体中文](README.zh-Hans.md) ·
[繁體中文](README.zh-Hant.md) · [日本語](README.ja.md) · [한국어](README.ko.md)
· [Español](README.es.md)

独立的本地沙漏网页。为不同人物设置出生日期与预期寿命，预览年龄，调整人物、沙粒、动画速度和主题。无需账号；数据保存在当前浏览器。

## 字体准备

源代码不含字体。下载 [v0.1.1 网页版](https://github.com/codingEzio/DeparturePixelZh-OSS/releases/download/v0.1.1/DeparturePixelZh-0.1.1-web.zip)，运行 `python3 scripts/prepare_font.py /path/to/DeparturePixelZh-0.1.1-web.zip`，再运行 `deno task build`。脚本验证 ZIP 和字体的 SHA-256；缺文件或哈希不符时构建失败。字体留在本机并由 Git 忽略；构建后可离线使用。 已有匹配的普通文件会重用；其他现有目标会保留并显示错误。 安全准备需要 Python 支持 `O_NOFOLLOW`、`O_NONBLOCK`，且文件系统支持硬链接；不支持时会失败，不覆盖目标。Termux 与 Windows 尚未测试。

组件声明见 `assets/fonts/`。Font Logos 和 Material Design 包含标志；此源代码及字体发行版未解决各图标的权利和商标限制。使用及再分发前须确认各图标的权利。

## 本机服务集成

`deno run -A scripts/service.ts --prepare` 生成已忽略的 Process Compose 与 macOS LaunchAgent 配置；`--install` 需要工作区端口登记，且拒绝覆盖现有服务。默认项目名称为目录名称；`SANDTIME_PROJECT_NAME`、`SANDTIME_WRAPPER`、`SANDTIME_PORT_REGISTRY`、`SANDTIME_COMPOSE` 可覆盖项目键、启动包装程序、登记脚本与 Process Compose 路径。服务使用登记端口并监听所有接口；预览默认使用 loopback 与临时端口，可由 `SANDTIME_PORT` 指定。机器配置留在环境变量或已忽略的 `Local/`、`deploy/`。保留原浏览器地址及端口，因为数据属于该 origin；更换源代码不会迁移数据。

## 界面示例

![Sandtime — Demo person](docs/demo/sandtime-en.png)

真实应用截图，使用合成数据：Demo person，出生于 2000-01-01，设定寿命为 80
年。显示的时间随时钟变化。此截图使用英文界面。

## 数据与备份

设置可导出为 JSON 备份。导入支持 Sandtime 备份、包含 `family.lifeCountdown` 与
Hourglass 设备设置的 Prometheus 设置导出，以及旧 Hourglass 人物 JSON。Prometheus
人物会加入现有数据；Sandtime
备份会在确认后替换本地数据。重复导入家人记录会被拒绝；原始文件不会被修改。清除浏览器数据或更换浏览器前请先导出备份。

每个导入文件上限为 5 MB；Sandtime 最多支持 1,000 人，名称最长 200
个字符。超出上限或重复的导入会被拒绝，不会更改现有数据。旧数据的归档和置顶状态保留在备份中，但目前不应用于人物列表。

保存需要支持 Web Locks
的安全网址。如果其他标签页更改数据，请重新加载后再编辑或导出。升级前请重新加载或关闭旧版
Sandtime 标签页，因为旧版不使用锁定。

## 运行与授权

需要支持 `deno bundle` 的 Deno。运行 `deno task build`，再运行
`deno task preview`，使用打印的本地网址。`deno task check` 检查类型与导入模型。

程序采用 GPL-3.0-only。所有者已于 2026-10-27
确认可重新分发所提供的解剖图像；来源与哈希见英文
README。仓库不包含个人设置或记录。

构建产物同时包含原样的项目许可证
`dist/LICENSE.txt`，以及完整现有字体声明和来源记录 `dist/font-notices.txt`。

## 仓库与发布

此仓库提供源码；发布构建产物或托管应用需另行决定。
