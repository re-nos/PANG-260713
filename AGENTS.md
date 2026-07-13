# AGENTS.md

이 파일은 에이전트(Claude Code 등)가 이 저장소에서 작업할 때 참고해야 할 기획/문서 정보를 안내합니다.

## 기획 문서

PANG 게임(퐁) 프로젝트의 기획 문서는 `docs/` 하위에 정리되어 있습니다.

- `docs/PRD.md` — PANG 게임 Mission 1의 개괄적인 특징 조사 자료 (전체 개요 수준).
- `docs/PLAN.md` — Phase별 목표를 세운 파일.
- `docs/FEATURES/main.md` — 첫 메인 화면(타이틀 화면) 구성 정의.
- `docs/FEATURES/game_rule.md` — 조작, 풍선 분열, 승패 조건, 생명/점수 시스템, 파워업 등 게임 룰 상세 내용.
- `docs/FEATURES/mission1.md` — `game_rule.md`의 공통 규칙을 기반으로 한 Mission 1 전용 난이도 및 세부 규칙.

새로운 기능/미션을 구현하거나 기획을 변경할 때는 위 문서를 먼저 확인하고, 규칙이 변경되면 관련 문서도 함께 갱신하세요.

## 참고

- 기술 스택, 빌드/실행 명령어, 프로젝트 구조 등 개발 환경 관련 안내는 `CLAUDE.md`를 참고하세요.
