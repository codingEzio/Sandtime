# Sandtime

<p><img src="docs/icon.svg" width="96" height="96" alt="Sandtime"></p>

[English](README.md) · [简体中文](README.zh-Hans.md) ·
[繁體中文](README.zh-Hant.md) · [日本語](README.ja.md) · [한국어](README.ko.md)
· [Español](README.es.md)

기본 개인 데이터가 비어 있는 독립 local hourglass입니다. 인물의 생일／목표
수명을 정하고 나이를 preview하며 인물／모래／motion／theme을 조정합니다.
account／remote service가 필요하지 않습니다.

## 화면 예시

![Sandtime — Demo person](docs/demo/sandtime-en.png)

실제 앱 화면에 합성 데이터인 Demo person, 생년월일 2000-01-01, 목표 수명 80년을
사용했습니다. 표시 시간은 시계에 따라 바뀝니다. 이 화면의 UI는 영어입니다.

## 데이터와 import

인물／설정은 browser와 origin에 저장합니다. Export backup으로 옮기며 site data
삭제 전 backup합니다. Sandtime backup、Prometheus
family.lifeCountdown／Hourglass device settings、legacy profiles 또는 API
items를 명시 import합니다. Prometheus는 추가、Sandtime backup은 확인 후
교체합니다. 중복 family／oversize는 기존 data를 바꾸지 않고
거부합니다.5MB／file、최대1000people、name200characters. approximate date
표시、옛 archived／pinned metadata는 backup에만 보존하며 목록에 적용하지
않습니다.

## Offline과 설정

첫 online 후 지원 service worker／origin에서 offline 사용합니다. 저장에는 secure
origin／Web Locks가 필요하며 다른 tab 갱신 뒤 reload합니다. upgrade 전 옛 tabs를
reload／close합니다. reduced-motion을 존중하고 System／bundled
Pixel、theme、모래／속도를 선택합니다.

## 실행

deno bundle 지원 Deno입니다. deno task build、preview는 loopback ephemeral URL을
씁니다. check는 타입／import／persistence model을 검증합니다. 이번 personal
profile import／reset／live data 작업은 없습니다.

빌드에는 원본 프로젝트 라이선스 `dist/LICENSE.txt`와 기존 글꼴의 모든 고지 및
출처를 담은 `dist/font-notices.txt`도 포함됩니다.

## Source와 권리

소스는 기존 GPL-3.0-only를 유지합니다. anatomy atlas／geometry／
adapted render는 기록된 owner prototype과 이전 애플리케이션에서 왔으며 영어 README에 hash／owner확인 날짜가
있습니다. DeparturePixelZh Compact는 OFL1.1／component notices를 유지합니다.
빌드 공개와 앱 호스팅은 별도 결정입니다.

Font preparation / 字型準備 / 字体准备: see [README](README.md#font-preparation).
