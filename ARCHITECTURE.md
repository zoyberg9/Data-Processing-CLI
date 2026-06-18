# 1. Runtime architecture
REPL
  ↓
dispatchCommand
  ↓
[command pipeline]
  parse → validate → DTO → core