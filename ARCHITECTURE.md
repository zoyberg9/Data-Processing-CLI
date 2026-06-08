# 1. Runtime architecture
    User Input
    ↓
    REPL (readline)
    ↓
    Command Parser
    ↓
    Command Dispatcher
    ↓
    Command Handlers
    ↓
    Node APIs
    (fs, streams, crypto, worker_threads)

# 2. Application State
    Owned by: application (main.js)
    REPL
    Owned by: input loop only
    Commands: Consume and mutate state

 # 3. Execution flow
    1. main.js starts program
    2. cwd initialized to user home directory
    3. REPL starts
    4. user enters command
    5. parser converts text → {command, args}
    6. dispatcher selects handler
    7. handler executes
    8. cwd printed again