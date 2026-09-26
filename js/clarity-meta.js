/**
 * Clarity metadata for concept pages: aliases ("also called") and
 * "not to be confused with" distinctions. Merged into catalog at runtime.
 *
 * aliases: other names for the SAME idea (not new concepts)
 * confusedWith: { id, note } — related but different; id may be null for non-page terms
 */
window.__LEARN_CLARITY__ = {
  "binary-bits": {
    aliases: ["bits", "bit string", "binary digits"],
    confusedWith: [
      { id: "boolean-logic", note: "Booleans are truth values; bits are storage/encoding units (often 0/1)." },
      { id: "number-systems", note: "Number systems are how we interpret bit patterns as numbers." },
      { id: "bit-manipulation", note: "Bit manipulation is operations on bits; this page is what bits are." }
    ]
  },
  "boolean-logic": {
    aliases: ["propositional logic (light)", "truth-table logic"],
    confusedWith: [
      { id: "binary-bits", note: "Logic studies truth; bits are physical/encoding 0/1." },
      { id: "bit-manipulation", note: "Bitwise AND/OR act on bit patterns; Boolean AND/OR act on true/false." }
    ]
  },
  "number-systems": {
    aliases: ["numeral systems", "radix / base"],
    confusedWith: [
      { id: "binary-bits", note: "Bits are the digits; number systems define place value and signed encodings." },
      { id: "encoding", note: "Encoding maps characters↔numbers; number systems map digit strings↔values." },
      { id: "floating-point", note: "Floating point is one specific binary encoding of reals, not 'bases' in general." }
    ]
  },
  "encoding": {
    aliases: ["character encoding", "charset", "text encoding"],
    confusedWith: [
      { id: "encryption", note: "Encoding is reversible representation; encryption hides data with a key." },
      { id: "hashing-crypto", note: "Hashes are one-way fingerprints; encodings must decode back." },
      { id: "number-systems", note: "UTF-8 uses bytes/bits; it is not a different 'base' for integers." }
    ]
  },
  "variables-types": {
    aliases: ["bindings", "typed values"],
    confusedWith: [
      { id: "type-systems", note: "Type systems are the rules; variables & types are the everyday objects those rules govern." },
      { id: "memory-pointers", note: "A variable may live at an address; a pointer is a value that stores an address." }
    ]
  },
  "memory-pointers": {
    aliases: ["addresses", "memory cells", "memory slots", "indirection", "references (loosely in C)"],
    confusedWith: [
      { id: "virtual-memory", note: "Virtual memory is the OS illusion of a private address space; pointers are values inside a program." },
      { id: "call-stack", note: "The call stack is a region/usage pattern of memory; a pointer is one kind of value stored there or on the heap." },
      { id: "arrays", note: "Arrays are contiguous slots; 'memory slot' here means a generic addressed cell, not the array ADT." },
      { id: "io-mmap", note: "mmap maps files into the address space; pointers still just hold addresses into that space." }
    ]
  },
  "big-o": {
    aliases: ["asymptotic notation", "order of growth", "O-notation"],
    confusedWith: [
      { id: "amortized-analysis", note: "Amortized averages cost over a sequence; Big-O usually bounds one operation or an algorithm." },
      { id: "p-vs-np", note: "P vs NP classifies problem difficulty; Big-O measures a specific algorithm's growth." }
    ]
  },
  "arrays": {
    aliases: ["lists (in some languages)", "vectors (contiguous)", "buffer"],
    confusedWith: [
      { id: "linked-lists", note: "Linked lists are node chains; arrays are contiguous indexed slots." },
      { id: "maps", note: "Maps associate keys→values; array indices are consecutive integers." },
      { id: "memory-pointers", note: "An array is a structure laid out in memory; a pointer may point at its base." }
    ]
  },
  "linked-lists": {
    aliases: ["node lists", "singly/doubly linked lists"],
    confusedWith: [
      { id: "arrays", note: "Arrays give O(1) index; lists give O(1) insert at a known node but slow random access." },
      {
        term: "skip list",
        termDef: "A probabilistic layered list for fast search — related spirit, different structure.",
        note: "Skip lists add express lanes over a list; not the same as a plain linked list."
      },
      { id: "graphs", note: "A list is a path-shaped graph; general graphs allow arbitrary edges." }
    ]
  },
  "stack": {
    aliases: ["LIFO stack", "pushdown stack"],
    confusedWith: [
      { id: "call-stack", note: "The call stack is the runtime's stack of frames; this page is the stack ADT you implement." },
      { id: "queue", note: "Queue is FIFO; stack is LIFO." },
      { id: "deque", note: "Deque allows both ends; a stack only uses one end." }
    ]
  },
  "queue": {
    aliases: ["FIFO queue"],
    confusedWith: [
      { id: "stack", note: "Stack is LIFO; queue is FIFO." },
      { id: "deque", note: "Deque is double-ended; a classic queue only enqueues rear / dequeues front." },
      { id: "priority-queues", note: "Priority queues remove by priority, not arrival order." }
    ]
  },
  "deque": {
    aliases: ["double-ended queue", "deck"],
    confusedWith: [
      { id: "queue", note: "A queue is a restricted deque (one end in, other end out)." },
      { id: "stack", note: "A stack is a restricted deque (same end in and out)." }
    ]
  },
  "hash-tables": {
    aliases: ["hash map (structure)", "dictionary (implementation)", "hashtable"],
    confusedWith: [
      { id: "maps", note: "Map/dictionary is the ADT (key→value); a hash table is a common implementation." },
      { id: "hashing-crypto", note: "Crypto hashes are one-way fingerprints; table hashes scatter keys into buckets." },
      { id: "sets", note: "A set stores membership only; a hash table usually stores key→value." }
    ]
  },
  "sets": {
    aliases: ["set ADT", "unique collection"],
    confusedWith: [
      { id: "sets-relations-functions", note: "Math sets are the foundation; this page is the programming Set collection." },
      { id: "maps", note: "Maps store values per key; sets store keys only." },
      { id: "bloom-filters", note: "Bloom filters are probabilistic; classic sets answer membership exactly." }
    ]
  },
  "maps": {
    aliases: ["dictionaries", "associative arrays", "key–value maps"],
    confusedWith: [
      { id: "hash-tables", note: "Hash table is one implementation of a map." },
      { id: "sets", note: "Sets have no associated value per key." },
      { id: "arrays", note: "Arrays index by dense integers; maps allow arbitrary keys." }
    ]
  },
  "binary-trees": {
    aliases: ["binary tree structure"],
    confusedWith: [
      { id: "bst", note: "A BST is a binary tree with ordering invariants; not every binary tree is a BST." },
      { id: "heaps", note: "Heaps are shape+heap-ordered trees (usually), not search-ordered." },
      { id: "graphs", note: "Trees are acyclic connected graphs; binary trees limit children to ≤2." }
    ]
  },
  "bst": {
    aliases: ["binary search tree", "ordered binary tree"],
    confusedWith: [
      { id: "binary-trees", note: "BST ⊆ binary trees with left < node < right (typical invariant)." },
      { id: "balanced-trees", note: "Balanced trees keep height small; a plain BST can skew into a list." },
      { id: "searching", note: "Binary search is on a sorted array; BST search walks a tree." }
    ]
  },
  "heaps": {
    aliases: ["binary heap", "heap-ordered tree"],
    confusedWith: [
      { id: "memory-pointers", note: "The 'heap' memory region is unrelated naming; this heap is a priority structure." },
      { id: "priority-queues", note: "Priority queue is the ADT; a binary heap is a common implementation." },
      { id: "bst", note: "BSTs order for search; heaps only guarantee priority at the root." }
    ]
  },
  "tries": {
    aliases: ["prefix trees", "digital trees"],
    confusedWith: [
      { id: "hash-tables", note: "Tries shine at prefix queries; hash tables shine at exact key lookup." },
      { id: "bst", note: "BSTs order whole keys; tries share structure by character prefixes." }
    ]
  },
  "balanced-trees": {
    aliases: ["AVL / red-black / B-trees (family)", "height-balanced trees"],
    confusedWith: [
      { id: "bst", note: "Balanced trees are BSTs (or multiway search trees) plus rebalancing rules." },
      { id: "heaps", note: "Heap balance is about shape/completeness, not search-key order." },
      { id: "indexes", note: "DB indexes often use B-trees; that is one application of balanced trees." }
    ]
  },
  "graphs": {
    aliases: ["networks (informal)", "node–edge structures"],
    confusedWith: [
      { id: "graph-theory-math", note: "This page is the CS graph structure; graph-theory-math emphasizes proofs/definitions." },
      { id: "binary-trees", note: "Trees are special graphs (acyclic, connected)." },
      { id: "maps", note: "Adjacency maps implement graphs; a map alone is not a graph." }
    ]
  },
  "priority-queues": {
    aliases: ["PQ"],
    confusedWith: [
      { id: "heaps", note: "Heap implements a priority queue; other implementations exist." },
      { id: "queue", note: "FIFO queues ignore priority; PQs serve highest (or lowest) priority first." }
    ]
  },
  "union-find": {
    aliases: ["disjoint-set union", "DSU", "merge-find"],
    confusedWith: [
      { id: "sets", note: "Union-find tracks partitions of elements efficiently; it is not a general Set ADT." },
      { id: "graphs", note: "Often used for connectivity in graphs (e.g. Kruskal), but it is its own structure." }
    ]
  },
  "bloom-filters": {
    aliases: ["probabilistic set"],
    confusedWith: [
      { id: "sets", note: "Bloom filters allow false positives; ordinary sets do not." },
      { id: "hash-tables", note: "Hash tables store keys (and values); Bloom filters only approximate membership." }
    ]
  },
  "recursion": {
    aliases: ["recursive functions"],
    confusedWith: [
      { id: "call-stack", note: "Recursion uses the call stack; the call stack also exists for ordinary nested calls." },
      { id: "dynamic-programming", note: "DP reuses overlapping subproblems; plain recursion may recompute them." },
      { id: "backtracking", note: "Backtracking is a search strategy that often uses recursion; recursion is the mechanism." }
    ]
  },
  "call-stack": {
    aliases: ["runtime stack", "execution stack", "function stack"],
    confusedWith: [
      { id: "stack", note: "Stack ADT is a data structure you build; the call stack is maintained by the language runtime." },
      { id: "memory-pointers", note: "Stack frames live in memory; pointers may point into stack or heap." },
      { id: "recursion", note: "Deep recursion grows the call stack; recursion ≠ the call stack itself." }
    ]
  },
  "searching": {
    aliases: ["lookup algorithms", "linear/binary search"],
    confusedWith: [
      { id: "bst", note: "Searching a BST uses tree order; binary search usually means a sorted array." },
      { id: "string-algorithms", note: "String search finds patterns in text; this page is general element search." },
      { id: "hash-tables", note: "Hash lookup is average O(1); binary search is O(log n) on sorted arrays." }
    ]
  },
  "sorting": {
    aliases: ["ordering algorithms"],
    confusedWith: [
      { id: "searching", note: "Sorting rearranges; searching finds." },
      { id: "topological-sort", note: "Topo sort orders a DAG by edges; comparison sorting orders keys by value." }
    ]
  },
  "divide-conquer": {
    aliases: ["D&C"],
    confusedWith: [
      { id: "dynamic-programming", note: "D&C splits independent subproblems; DP saves overlapping ones." },
      { id: "recursion", note: "Many D&C algorithms are recursive, but recursion alone is not D&C." }
    ]
  },
  "greedy": {
    aliases: ["greedy choice algorithms"],
    confusedWith: [
      { id: "dynamic-programming", note: "Greedy commits locally; DP considers combinations of subproblems when greedy fails." },
      { id: "backtracking", note: "Backtracking can undo; pure greedy never retreats." }
    ]
  },
  "dynamic-programming": {
    aliases: ["DP", "memoized recursion (related)"],
    confusedWith: [
      { id: "divide-conquer", note: "DP needs overlapping subproblems; classic D&C subproblems are disjoint." },
      { id: "recursion", note: "Memoization is recursion + cache; DP often fills a table bottom-up." },
      { id: "greedy", note: "Greedy picks locally; DP systematically combines optima." }
    ]
  },
  "backtracking": {
    aliases: ["generate-and-test search", "trial and undo"],
    confusedWith: [
      { id: "dfs", note: "Backtracking is often DFS on an implicit tree of choices." },
      { id: "dynamic-programming", note: "DP stores answers; backtracking explores and abandons partial solutions." },
      { id: "recursion", note: "Backtracking commonly uses recursion; the idea is search with undo." }
    ]
  },
  "bfs": {
    aliases: ["breadth-first search", "level-order graph search"],
    confusedWith: [
      { id: "dfs", note: "BFS explores by distance/layers; DFS goes deep first." },
      { id: "queue", note: "BFS uses a queue for the frontier; the queue is the tool, not the algorithm." },
      { id: "shortest-paths", note: "BFS gives shortest paths in unweighted graphs; weighted needs Dijkstra-style methods." }
    ]
  },
  "dfs": {
    aliases: ["depth-first search"],
    confusedWith: [
      { id: "bfs", note: "DFS dives deep; BFS expands layer by layer." },
      { id: "stack", note: "DFS uses an explicit stack or the call stack; that does not make DFS 'the stack ADT'." },
      { id: "backtracking", note: "Backtracking is DFS-shaped search with constraints and undo." }
    ]
  },
  "shortest-paths": {
    aliases: ["Dijkstra / Bellman-Ford family"],
    confusedWith: [
      { id: "bfs", note: "BFS is shortest hops when every edge weighs 1." },
      { id: "mst", note: "MST minimizes total edge weight of a tree; shortest paths minimize distance from a source." },
      { id: "network-flow", note: "Flow maximizes throughput under capacities; shortest paths minimize path cost." }
    ]
  },
  "mst": {
    aliases: ["minimum spanning tree", "min spanning tree"],
    confusedWith: [
      { id: "shortest-paths", note: "Shortest-path trees minimize distances from a source; MSTs minimize total weight." },
      { id: "union-find", note: "Kruskal uses union-find; union-find is the helper structure, not the MST itself." }
    ]
  },
  "string-algorithms": {
    aliases: ["string matching", "pattern search in text"],
    confusedWith: [
      { id: "searching", note: "General searching finds an element; string algorithms find substrings/patterns." },
      { id: "regex", note: "Regex is a language of patterns; string algorithms include concrete matchers (KMP, etc.)." },
      { id: "tries", note: "Tries store many strings for prefix ops; matching scans a text for a pattern." }
    ]
  },
  "bit-manipulation": {
    aliases: ["bitwise operations", "bit tricks"],
    confusedWith: [
      { id: "binary-bits", note: "Bits are the values; bit manipulation is operating on them." },
      { id: "boolean-logic", note: "Boolean logic is about truth; bitwise ops run in parallel across bit positions." }
    ]
  },
  "regex": {
    aliases: ["regular expressions", "regex patterns"],
    confusedWith: [
      { id: "finite-automata", note: "Regex ↔ finite automata in theory; engines add features beyond plain regular languages." },
      { id: "string-algorithms", note: "Regex is a pattern language; KMP etc. are specific algorithms." },
      { id: "cfgs", note: "Nested constructs (balanced parens) need CFGs/pushdown power, not plain regex." }
    ]
  },
  "amortized-analysis": {
    aliases: ["amortized cost", "aggregate/accounting/potential methods"],
    confusedWith: [
      { id: "big-o", note: "Amortized spreads expensive rare ops over many cheap ones; worst-case Big-O per op can still be high." },
      { id: "expectation", note: "Amortized is deterministic averaging over a sequence; expectation averages over randomness." }
    ]
  },
  "topological-sort": {
    aliases: ["topo sort", "DAG ordering"],
    confusedWith: [
      { id: "sorting", note: "Comparison sorting orders values; topo sort respects directed edges." },
      { id: "dfs", note: "One topo algorithm uses DFS finish times; DFS alone is not topo sort." }
    ]
  },
  "network-flow": {
    aliases: ["max flow", "flow networks"],
    confusedWith: [
      { id: "shortest-paths", note: "Shortest path minimizes cost/length; max flow maximizes rate under capacities." },
      { id: "mst", note: "MST picks edges for a tree; flow pushes commodity through capacities." }
    ]
  },
  "online-algorithms": {
    aliases: ["online decision algorithms"],
    confusedWith: [
      {
        term: "streaming algorithms",
        termDef: "Algorithms that see data once in a stream with limited memory.",
        note: "Streaming constrains memory/passes; online constrains knowing the future."
      },
      { id: "greedy", note: "Many online algorithms are greedy-shaped, but 'online' means inputs arrive over time." }
    ]
  },
  "oop": {
    aliases: ["object-oriented programming", "objects & classes"],
    confusedWith: [
      { id: "functional", note: "FP emphasizes immutable data and pure functions; OOP emphasizes encapsulating state with methods." },
      { id: "design-patterns", note: "Patterns are reusable designs; OOP is a broader paradigm those patterns often use." }
    ]
  },
  "functional": {
    aliases: ["FP", "functional style"],
    confusedWith: [
      { id: "oop", note: "Different default tools for structuring programs; both can appear in one language." },
      { id: "recursion", note: "FP uses recursion often; recursion exists outside FP too." }
    ]
  },
  "concurrency": {
    aliases: ["concurrent execution"],
    confusedWith: [
      { id: "parallelism", note: "Concurrency is about structuring overlapping tasks; parallelism is running them at the same time." },
      { id: "threads-processes", note: "Threads/processes are units you schedule; concurrency is the broader phenomenon." }
    ]
  },
  "parallelism": {
    aliases: ["parallel computing (intro)"],
    confusedWith: [
      { id: "concurrency", note: "You can be concurrent on one core (interleaving) without parallel speedup." },
      { id: "synchronization", note: "Parallelism creates sharing hazards; synchronization is how you coordinate." }
    ]
  },
  "threads-processes": {
    aliases: ["OS threads", "lightweight vs heavyweight tasks"],
    confusedWith: [
      { id: "os-processes", note: "Processes isolate address spaces; threads of a process typically share memory." },
      { id: "concurrency", note: "Threads enable concurrency; concurrency can also use async/event loops." }
    ]
  },
  "synchronization": {
    aliases: ["locks / mutexes", "coordination primitives"],
    confusedWith: [
      { id: "deadlocks", note: "Deadlock is a failure mode of careless synchronization." },
      { id: "memory-consistency", note: "Consistency models say what values are visible; locks are one way to enforce ordering." }
    ]
  },
  "deadlocks": {
    aliases: ["deadly embrace (historic)"],
    confusedWith: [
      { id: "synchronization", note: "Locks prevent races; deadlock is when waiting forms a cycle." },
      {
        term: "livelock",
        termDef: "States keep changing but make no useful progress.",
        note: "Deadlock is stuck waiting; livelock is busy but still gets nowhere."
      }
    ]
  },
  "os-processes": {
    aliases: ["processes", "OS process abstraction"],
    confusedWith: [
      { id: "threads-processes", note: "This page emphasizes process isolation & lifecycle; threads share a process." },
      { id: "scheduling", note: "Scheduling chooses which ready process/thread runs next." }
    ]
  },
  "scheduling": {
    aliases: ["CPU scheduling", "dispatching"],
    confusedWith: [
      { id: "os-processes", note: "Processes are what exist; scheduling decides who gets the CPU." },
      { id: "concurrency", note: "Scheduling implements concurrent sharing of cores." }
    ]
  },
  "virtual-memory": {
    aliases: ["VM (memory)", "paged virtual address space"],
    confusedWith: [
      { id: "memory-pointers", note: "Programs use virtual addresses; pointers hold those addresses." },
      { id: "caching", note: "Page cache / TLB are caches; virtual memory is the address translation + backing store design." },
      { id: "garbage-collection", note: "GC reclaims unreachable objects; virtual memory moves pages between RAM and disk." }
    ]
  },
  "caching": {
    aliases: ["cache", "memoization store (related idea)"],
    confusedWith: [
      { id: "virtual-memory", note: "Caching is keeping hot data close; VM is a full address-space abstraction." },
      {
        term: "memoization",
        termDef: "Caching function results keyed by arguments.",
        note: "Memoization is a specific cache of computed answers; hardware/OS caches are broader."
      },
      { id: "indexes", note: "DB indexes speed lookup by structure; caches speed repeat access by locality." }
    ]
  },
  "file-systems": {
    aliases: ["FS", "filesystem"],
    confusedWith: [
      { id: "io-mmap", note: "File systems organize durable storage; mmap maps file bytes into memory." },
      {
        term: "database storage engines",
        termDef: "DB engines manage tables, indexes, and recovery — often atop files.",
        note: "A DB uses a file system (or raw device); it is not itself 'the filesystem'."
      }
    ]
  },
  "compilers": {
    aliases: ["compiler & interpreter pipeline"],
    confusedWith: [
      { id: "cfgs", note: "Grammars describe syntax; compilers use them in parsing." },
      { id: "finite-automata", note: "Lexers often use automata; that is one compiler phase." },
      { id: "linking-loading", note: "Compilation produces objects; linking/loading produce a runnable image." }
    ]
  },
  "garbage-collection": {
    aliases: ["GC", "automatic memory management"],
    confusedWith: [
      { id: "memory-pointers", note: "Manual free vs GC both deal with heap objects; GC tracks reachability." },
      { id: "virtual-memory", note: "GC is about objects; virtual memory is about pages/frames." },
      { id: "caching", note: "GC is not a performance cache; it reclaims unused memory." }
    ]
  },
  "syscalls": {
    aliases: ["system calls", "kernel traps (related)"],
    confusedWith: [
      { id: "interrupts", note: "Syscalls are voluntary requests from user code; interrupts are usually external/asynchronous." },
      { id: "rpc", note: "RPC crosses machines/processes; syscalls cross the user/kernel boundary on one machine." }
    ]
  },
  "interrupts": {
    aliases: ["IRQs", "hardware interrupts"],
    confusedWith: [
      { id: "syscalls", note: "Syscalls are synchronous requests; interrupts can fire anytime." },
      {
        term: "exceptions / traps",
        termDef: "CPU events from faults or privileged ops (page fault, syscall entry, divide-by-zero).",
        note: "Interrupts are usually external; exceptions/traps often come from the running instruction."
      }
    ]
  },
  "memory-consistency": {
    aliases: ["memory models", "shared-memory ordering"],
    confusedWith: [
      { id: "consistency-models", note: "Distributed consistency is about replicated data; memory consistency is about loads/stores on shared RAM." },
      { id: "synchronization", note: "Locks/atomics constrain what the memory model allows you to rely on." }
    ]
  },
  "io-mmap": {
    aliases: ["memory-mapped I/O (files)", "mmap"],
    confusedWith: [
      { id: "virtual-memory", note: "mmap uses VM mechanisms to map a file; not all VM is file-backed." },
      { id: "file-systems", note: "FS stores the bytes; mmap is one way to access them." }
    ]
  },
  "linking-loading": {
    aliases: ["linkers & loaders"],
    confusedWith: [
      { id: "compilers", note: "Compile translates a TU; link combines TUs; load maps the image to run." },
      {
        term: "dynamic linking",
        termDef: "Resolve shared libraries at load/run time instead of copying them in at static link.",
        note: "Dynamic linking is a linking strategy; this page covers the whole link+load pipeline."
      }
    ]
  },
  "osi-tcpip": {
    aliases: ["network layer models", "protocol stack"],
    confusedWith: [
      { id: "tcp-udp", note: "TCP/UDP are transport protocols inside the stack model." },
      { id: "sockets", note: "Sockets are the API endpoint; layers are the conceptual stack." }
    ]
  },
  "tcp-udp": {
    aliases: ["transport protocols"],
    confusedWith: [
      { id: "http", note: "HTTP usually rides on TCP; HTTP is an application protocol." },
      { id: "tls-https", note: "TLS encrypts a byte stream (often under HTTPS); TCP still provides reliability." },
      { id: "sockets", note: "Sockets are how programs speak TCP/UDP." }
    ]
  },
  "http": {
    aliases: ["Hypertext Transfer Protocol"],
    confusedWith: [
      { id: "rest-apis", note: "REST is an API style often using HTTP; HTTP is the protocol." },
      { id: "tls-https", note: "HTTPS is HTTP over TLS." },
      { id: "rpc", note: "RPC is a calling style; it may use HTTP or other transports." }
    ]
  },
  "dns": {
    aliases: ["Domain Name System"],
    confusedWith: [
      { id: "encoding", note: "DNS names are labels; DNS is a distributed lookup system, not character encoding." },
      { id: "http", note: "Browsers resolve DNS before speaking HTTP to an IP." }
    ]
  },
  "rest-apis": {
    aliases: ["RESTful APIs"],
    confusedWith: [
      { id: "http", note: "REST uses HTTP idioms; not every HTTP API is REST." },
      { id: "rpc", note: "RPC APIs expose procedures; REST APIs expose resources." }
    ]
  },
  "sockets": {
    aliases: ["network sockets", "Berkeley sockets (family)"],
    confusedWith: [
      { id: "tcp-udp", note: "Sockets are the programming interface to protocols like TCP/UDP." },
      { id: "rpc", note: "RPC libraries often use sockets underneath." }
    ]
  },
  "tls-https": {
    aliases: ["HTTPS", "TLS", "SSL (legacy name)"],
    confusedWith: [
      { id: "encryption", note: "TLS is a protocol using cryptography; encryption is the broader primitive." },
      { id: "http", note: "HTTPS = HTTP + TLS." },
      { id: "auth", note: "TLS authenticates servers (and optionally clients); app login is usually separate." }
    ]
  },
  "congestion-control": {
    aliases: ["AIMD / cwnd control"],
    confusedWith: [
      { id: "tcp-udp", note: "Congestion control is mainly a TCP (and QUIC) behavior, not UDP's default." },
      {
        term: "flow control",
        termDef: "Receiver tells sender to slow down so its buffers do not overflow.",
        note: "Flow control protects one receiver; congestion control protects the shared network."
      }
    ]
  },
  "rpc": {
    aliases: ["remote procedure call"],
    confusedWith: [
      { id: "rest-apis", note: "RPC calls methods; REST manipulates resources via HTTP verbs." },
      { id: "syscalls", note: "Syscalls are local kernel entries; RPC crosses process/machine boundaries." }
    ]
  },
  "relational": {
    aliases: ["relational model", "tables/relations"],
    confusedWith: [
      { id: "sql", note: "SQL is the language; the relational model is the theory of tables/keys." },
      { id: "nosql", note: "NoSQL drops or reshapes relational assumptions for other workloads." }
    ]
  },
  "sql": {
    aliases: ["Structured Query Language"],
    confusedWith: [
      { id: "relational", note: "SQL queries relational databases; it is not the model itself." },
      { id: "query-plans", note: "SQL is what you write; the plan is how the engine executes it." }
    ]
  },
  "indexes": {
    aliases: ["DB indexes", "B-tree / hash indexes"],
    confusedWith: [
      { id: "arrays", note: "An array index is a position; a DB index is an auxiliary lookup structure." },
      { id: "balanced-trees", note: "Many indexes are B-trees—an application of balanced trees." },
      { id: "caching", note: "Indexes change how you find rows; caches keep hot pages/results around." }
    ]
  },
  "transactions": {
    aliases: ["ACID transactions", "txns"],
    confusedWith: [
      { id: "isolation-levels", note: "Isolation levels tune what concurrent transactions may see." },
      { id: "wal-replication", note: "WAL helps durability/recovery; transactions are the all-or-nothing unit." }
    ]
  },
  "nosql": {
    aliases: ["non-relational stores"],
    confusedWith: [
      { id: "relational", note: "Different data models and scaling tradeoffs—not 'no SQL language' literally." },
      { id: "cap-theorem", note: "CAP constrains distributed DB design; NoSQL is a product/model category." }
    ]
  },
  "cap-theorem": {
    aliases: ["Brewer's theorem"],
    confusedWith: [
      { id: "consistency-models", note: "CAP's 'C' is one notion of consistency; distributed models are finer-grained." },
      { id: "transactions", note: "ACID is about local transactional guarantees; CAP is about distributed tradeoffs." }
    ]
  },
  "normalization": {
    aliases: ["normal forms", "1NF–3NF"],
    confusedWith: [
      { id: "encoding", note: "Normalization here means schema design, not Unicode normalization." },
      { id: "relational", note: "Normalization applies relational design principles to reduce redundancy." }
    ]
  },
  "isolation-levels": {
    aliases: ["transaction isolation"],
    confusedWith: [
      { id: "transactions", note: "Isolation is one ACID letter; levels choose the concurrency/anomaly tradeoff." },
      { id: "consistency-models", note: "Different domain: DB txn isolation vs replicated-data consistency." }
    ]
  },
  "wal-replication": {
    aliases: ["write-ahead logging", "log shipping (related)"],
    confusedWith: [
      { id: "transactions", note: "WAL implements durability/recovery for transactional stores." },
      { id: "version-control", note: "Both keep history-like logs; WAL is for crash recovery, not human collaboration." }
    ]
  },
  "query-plans": {
    aliases: ["execution plans", "query optimization output"],
    confusedWith: [
      { id: "sql", note: "SQL is declarative; the plan is the procedural tree the optimizer chooses." },
      { id: "indexes", note: "Plans decide whether/how to use indexes." }
    ]
  },
  "hashing-crypto": {
    aliases: ["cryptographic hash", "digest"],
    confusedWith: [
      { id: "hash-tables", note: "Table hashes distribute keys; crypto hashes aim for collision resistance & one-wayness." },
      { id: "encryption", note: "Hashes don't encrypt (no key to decrypt); encryption is reversible with a key." },
      { id: "encoding", note: "Base64 is encoding; SHA-256 is hashing." }
    ]
  },
  "encryption": {
    aliases: ["encipherment", "ciphertext"],
    confusedWith: [
      { id: "encoding", note: "Encoding is not secret; encryption requires a key." },
      { id: "hashing-crypto", note: "Encryption decrypts; hashing does not." },
      { id: "tls-https", note: "TLS uses encryption as part of a protocol." }
    ]
  },
  "auth": {
    aliases: ["authn & authz", "login & permissions"],
    confusedWith: [
      { id: "oauth-jwt", note: "OAuth/JWT are common web mechanisms for delegated authn/authz." },
      { id: "encryption", note: "Encryption protects confidentiality; auth answers who you are / what you may do." },
      { id: "tls-https", note: "TLS authenticates the channel endpoints; app auth authenticates users/sessions." }
    ]
  },
  "threat-models": {
    aliases: ["attacker models", "security assumptions"],
    confusedWith: [
      { id: "web-vulnerabilities", note: "Threat models define who/what you fear; vulns are concrete bug classes." },
      { id: "auth", note: "Auth is a control; threat modeling decides which controls you need." }
    ]
  },
  "oauth-jwt": {
    aliases: ["OAuth 2 / OpenID Connect (related)", "bearer tokens"],
    confusedWith: [
      { id: "auth", note: "OAuth delegates authorization; JWT is a token format often used afterward." },
      {
        term: "server sessions",
        termDef: "Server-side stored login state keyed by a session cookie.",
        note: "Sessions store state on the server; JWTs often carry claims on the client."
      },
      { id: "encryption", note: "JWTs are usually signed (integrity), not encrypted by default." }
    ]
  },
  "web-vulnerabilities": {
    aliases: ["XSS / CSRF / injection (classes)"],
    confusedWith: [
      { id: "threat-models", note: "Vulns are specific failure patterns; threat models set the context." },
      { id: "encryption", note: "HTTPS doesn't fix XSS in your HTML; different layer." }
    ]
  },
  "induction-invariants": {
    aliases: ["mathematical induction", "loop invariants"],
    confusedWith: [
      { id: "recursion", note: "Induction proves; recursion computes—often matching structures." },
      { id: "big-o", note: "Proofs establish correctness; Big-O establishes growth." }
    ]
  },
  "sets-relations-functions": {
    aliases: ["discrete sets", "relations & functions (math)"],
    confusedWith: [
      { id: "sets", note: "Programming Set collections vs mathematical set theory language." },
      { id: "maps", note: "Functions relate inputs→outputs; maps are a programming ADT." }
    ]
  },
  "combinatorics": {
    aliases: ["counting", "combinations & permutations"],
    confusedWith: [
      { id: "probability-basics", note: "Counting often feeds probability; probability adds a measure on outcomes." },
      { id: "big-o", note: "Combinatorial counts can explain algorithm costs; Big-O summarizes growth." }
    ]
  },
  "modular-arithmetic": {
    aliases: ["clock arithmetic", "mod n"],
    confusedWith: [
      { id: "number-systems", note: "Bases represent numbers; mod wraps remainders in a fixed modulus." },
      { id: "hash-tables", note: "Table indexing often uses mod bucket count—an application of modular arithmetic." }
    ]
  },
  "graph-theory-math": {
    aliases: ["graphs as math objects"],
    confusedWith: [
      { id: "graphs", note: "Same objects; this page stresses definitions/proofs, the other stresses CS representation & algos." }
    ]
  },
  "probability-basics": {
    aliases: ["probability theory (intro)"],
    confusedWith: [
      { id: "expectation", note: "Probability assigns weights; expectation averages random values." },
      { id: "balls-bins", note: "Balls-and-bins is a probability model used constantly in CS." }
    ]
  },
  "expectation": {
    aliases: ["expected value", "E[X]", "linearity of expectation"],
    confusedWith: [
      { id: "amortized-analysis", note: "Expectation averages randomness; amortized averages a deterministic sequence." },
      { id: "probability-basics", note: "Expectation builds on probability of events/values." }
    ]
  },
  "balls-bins": {
    aliases: ["balls and bins", "birthday paradox (related)"],
    confusedWith: [
      { id: "hash-tables", note: "Collisions in hashing are a balls-and-bins story." },
      { id: "bloom-filters", note: "Bloom bit setting is another balls-and-bins-style occupancy process." }
    ]
  },
  "finite-automata": {
    aliases: ["DFA / NFA", "state machines (finite)"],
    confusedWith: [
      { id: "regex", note: "Regex describe regular languages; automata recognize them." },
      { id: "cfgs", note: "CFGs are strictly more powerful than finite automata." }
    ]
  },
  "cfgs": {
    aliases: ["context-free grammars", "BNF-style grammars"],
    confusedWith: [
      { id: "regex", note: "CFGs can express nesting regex cannot (in the formal sense)." },
      { id: "compilers", note: "Parsers use CFGs; compilers are the full translation pipeline." }
    ]
  },
  "decidability": {
    aliases: ["computability (postcard)", "decidable vs undecidable"],
    confusedWith: [
      { id: "p-vs-np", note: "P vs NP is about efficient solvability; undecidable problems aren't solvable at all by algorithm." },
      { id: "big-o", note: "Undecidable ≠ 'slow'; it means no algorithm exists that always answers." }
    ]
  },
  "p-vs-np": {
    aliases: ["complexity classes P/NP", "NP-completeness (related)"],
    confusedWith: [
      { id: "decidability", note: "NP problems are decidable (in principle); the question is polynomial-time solvability." },
      { id: "big-o", note: "Big-O describes an algorithm; P/NP classify problems." }
    ]
  },
  "instruction-cycle": {
    aliases: ["fetch–decode–execute", "instruction cycle"],
    confusedWith: [
      { id: "pipelining", note: "Pipelining overlaps stages of many instructions; the cycle is one instruction's stages." },
      { id: "assembly-basics", note: "Assembly is the language; the cycle is how the CPU runs each instruction." }
    ]
  },
  "assembly-basics": {
    aliases: ["asm", "machine-oriented code"],
    confusedWith: [
      { id: "compilers", note: "Compilers often emit assembly/machine code; assembly is what you read/write at that level." },
      { id: "instruction-cycle", note: "CPU hardware executes instructions; assembly names those instructions." }
    ]
  },
  "pipelining": {
    aliases: ["instruction pipeline"],
    confusedWith: [
      { id: "parallelism", note: "Pipeline parallelism overlaps stages; multicore parallelism overlaps whole instructions/threads." },
      { id: "instruction-cycle", note: "Pipeline implements the stages concurrently across instructions." }
    ]
  },
  "floating-point": {
    aliases: ["IEEE-754 floats", "floats/doubles"],
    confusedWith: [
      { id: "number-systems", note: "Floats are a specific binary encoding of reals with exponent+mantissa." },
      {
        term: "fixed-point",
        termDef: "Real numbers with a fixed number of fraction bits (scaled integers).",
        note: "Fixed-point scales integers; floating-point has a moving exponent."
      }
    ]
  },
  "endianness-alignment": {
    aliases: ["byte order", "struct alignment/padding"],
    confusedWith: [
      { id: "encoding", note: "Endianness is byte order of multi-byte values; text encoding is characters↔bytes." },
      { id: "memory-pointers", note: "Alignment constrains valid addresses for types; pointers still hold addresses." }
    ]
  },
  "failures-timeouts": {
    aliases: ["partial failure", "timeout-based detection"],
    confusedWith: [
      { id: "idempotency-retries", note: "Timeouts cause retries; idempotency makes retries safe." },
      { id: "deadlocks", note: "Deadlocks freeze progress with circular waits; network failures drop/delay messages." }
    ]
  },
  "consistency-models": {
    aliases: ["distributed consistency", "linearizability / eventual consistency"],
    confusedWith: [
      { id: "cap-theorem", note: "CAP is a broad tradeoff slogan; consistency models name precise guarantees." },
      { id: "memory-consistency", note: "Shared-memory models ≠ replicated-data models (related vocabulary, different setting)." },
      { id: "isolation-levels", note: "Txn isolation is database concurrency control, not replica consistency." }
    ]
  },
  "logical-clocks": {
    aliases: ["Lamport clocks", "happens-before"],
    confusedWith: [
      { id: "consensus-raft", note: "Clocks order events; consensus agrees on a value/log despite failures." },
      {
        term: "NTP / wall clocks",
        termDef: "Network Time Protocol synchronizes real-world clock time.",
        note: "Logical clocks order causality without trusting synchronized wall time."
      }
    ]
  },
  "consensus-raft": {
    aliases: ["Raft consensus", "replicated log agreement"],
    confusedWith: [
      { id: "consistency-models", note: "Consensus is a protocol to agree; consistency models describe observable guarantees." },
      { id: "transactions", note: "Some distributed txns use consensus underneath; they are not the same idea." }
    ]
  },
  "idempotency-retries": {
    aliases: ["idempotent operations", "at-least-once + dedupe"],
    confusedWith: [
      { id: "failures-timeouts", note: "Retries react to failures/timeouts; idempotency is the safety property under duplicates." },
      {
        term: "exactly-once delivery",
        termDef: "A marketing phrase; systems usually offer at-least-once plus idempotent handlers.",
        note: "True exactly-once end-to-end is subtle; idempotent retries are the practical tool."
      }
    ]
  },
  "consistent-hashing": {
    aliases: ["hash rings", "rendezvous hashing (related family)"],
    confusedWith: [
      { id: "hash-tables", note: "Both use hashing; consistent hashing minimizes remaps when nodes change." },
      { id: "hashing-crypto", note: "Crypto hashes provide integrity; consistent hashing places keys on nodes." }
    ]
  },
  "type-systems": {
    aliases: ["static/dynamic typing rules"],
    confusedWith: [
      { id: "variables-types", note: "Types classify values; type systems are the rules/enforcement." },
      { id: "oop", note: "OOP uses types/classes heavily; type systems exist in non-OOP languages too." }
    ]
  },
  "testing": {
    aliases: ["automated tests", "test pyramid"],
    confusedWith: [
      {
        term: "debugging",
        termDef: "Finding why a specific failure happened.",
        note: "Tests try to catch regressions systematically; debugging investigates one failure."
      },
      { id: "type-systems", note: "Types catch some classes of bugs early; tests check behavior examples." }
    ]
  },
  "design-patterns": {
    aliases: ["software patterns"],
    confusedWith: [
      { id: "oop", note: "Many classic patterns assume OOP, but the idea is reusable structure." },
      {
        term: "algorithms",
        termDef: "Step-by-step methods to compute a result.",
        note: "Patterns structure code relationships; algorithms structure computational steps."
      }
    ]
  },
  "version-control": {
    aliases: ["VCS", "Git (common tool)"],
    confusedWith: [
      { id: "wal-replication", note: "Both keep ordered history; VCS is for source collaboration, WAL for DB durability." },
      {
        term: "backups",
        termDef: "Copies of data for disaster recovery.",
        note: "Version control tracks evolving source; backups snapshot data for restore."
      }
    ]
  },
  "linear-algebra": {
    aliases: ["vectors & matrices"],
    confusedWith: [
      { id: "arrays", note: "Arrays store entries; linear algebra defines operations/meaning on vectors/matrices." },
      { id: "gradient-descent", note: "Gradients live in vector spaces; descent is an optimization algorithm." }
    ]
  },
  "gradient-descent": {
    aliases: ["GD / SGD (family)"],
    confusedWith: [
      { id: "backtracking", note: "GD follows a local slope; backtracking searches discrete choices with undo." },
      { id: "greedy", note: "Both are local; GD is continuous optimization, greedy is usually discrete choice." },
      { id: "bias-variance", note: "GD is how you optimize; bias–variance describes error sources of the learned model." }
    ]
  },
  "bias-variance": {
    aliases: ["bias–variance tradeoff"],
    confusedWith: [
      {
        term: "overfitting",
        termDef: "Fitting training noise so badly that new data suffers.",
        note: "Overfitting is high variance in the bias–variance story — not a separate unrelated idea."
      },
      { id: "big-o", note: "Bias–variance is statistical error decomposition; Big-O is computational growth." }
    ]
  },
  "proof-techniques": {
    aliases: ["proof methods", "proof strategies"],
    confusedWith: [
      { id: "induction-invariants", note: "Induction is one technique; this page surveys the common shapes including contradiction and diagonalization." },
      { id: "decidability", note: "Decidability uses diagonalization/self-reference; proof techniques are the general toolkit." }
    ]
  },
  "turing-machines": {
    aliases: ["TM", "Turing machine model"],
    confusedWith: [
      { id: "finite-automata", note: "DFAs have finite memory and read-only left-to-right input; TMs have an unbounded read/write tape." },
      { id: "decidability", note: "TMs are the model; decidability asks which languages TMs can settle." },
      { id: "compilers", note: "Compilers are real programs; TMs are the mathematical machine model." }
    ]
  },
  "recurrences": {
    aliases: ["Master theorem", "divide-and-conquer recurrences"],
    confusedWith: [
      { id: "recursion", note: "Recursion is a coding pattern; recurrences are equations for cost T(n)." },
      { id: "big-o", note: "Big-O is the notation; the Master theorem gives Big-O solutions for common recurrences." },
      { id: "amortized-analysis", note: "Amortized averages a sequence of ops; Master solves a recurrence for one algorithm's size-n cost." }
    ]
  },
  "conditional-probability": {
    aliases: ["Bayes' rule", "posterior probability"],
    confusedWith: [
      { id: "probability-basics", note: "Basics cover sample spaces/events; conditioning updates probabilities given evidence." },
      { id: "expectation", note: "Expectation is average value; Bayes updates beliefs about hypotheses." }
    ]
  },
  "variance-concentration": {
    aliases: ["Chebyshev", "concentration inequalities (light)"],
    confusedWith: [
      { id: "expectation", note: "Expectation is the center; variance is spread around it." },
      { id: "bias-variance", note: "Bias–variance is ML error decomposition; this page is probabilistic variance/tails." }
    ]
  },
  "randomized-algorithms": {
    aliases: ["Las Vegas / Monte Carlo algorithms"],
    confusedWith: [
      { id: "probability-basics", note: "Probability is the math; randomized algorithms put randomness inside the procedure." },
      { id: "online-algorithms", note: "Online decides without future input; randomized may still see the whole input but flip coins." }
    ]
  },
  "markov-chains": {
    aliases: ["Markov process (discrete time)", "memoryless chains"],
    confusedWith: [
      { id: "conditional-probability", note: "Chains use conditional transitions; Bayes is about updating hypotheses from evidence." },
      { id: "logical-clocks", note: "Logical clocks order events; Markov chains are stochastic state processes." }
    ]
  },
  "information-theory": {
    aliases: ["Shannon entropy", "information content"],
    confusedWith: [
      { id: "probability-basics", note: "Entropy is a functional of a distribution, not a replacement for probability axioms." },
      { id: "hashing-crypto", note: "Crypto hashes scramble for integrity; entropy measures uncertainty of a source." },
      { id: "encoding", note: "Encodings represent data; entropy bounds ideal compression length." }
    ]
  },
  "eigenvalues-svd": {
    aliases: ["singular value decomposition", "eigen-decomposition (related)"],
    confusedWith: [
      { id: "linear-algebra", note: "Linear algebra is the broader toolkit; this page focuses on spectral/SVD geometry." },
      { id: "gradient-descent", note: "GD optimizes a function; eigenvalues describe linear maps / curvature sometimes." }
    ]
  },
  "supervised-learning": {
    aliases: ["learning from labeled data"],
    confusedWith: [
      { id: "bias-variance", note: "Bias–variance diagnoses error sources; supervised learning is the overall labeled-data paradigm." },
      { id: "gradient-descent", note: "GD is a common optimizer; supervised learning is the problem setting." },
      {
        term: "unsupervised learning",
        termDef: "Learning structure without labels (clustering, density).",
        note: "Supervised uses labeled targets; unsupervised does not."
      }
    ]
  }
};

