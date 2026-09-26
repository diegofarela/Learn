/**
 * Master registry of CS concepts for the Learn hub.
 * status: "ready" | "soon"
 * Only "ready" concepts get a page under concepts/{id}.html
 */
window.__LEARN_CATALOG__ = {
  topics: [
    {
      id: "foundations",
      label: "Foundations",
      concepts: [
        { id: "binary-bits", name: "Binary & bits", hint: "Base-2, places, flipping bits" },
        { id: "boolean-logic", name: "Boolean logic", hint: "AND, OR, NOT, truth tables" },
        { id: "number-systems", name: "Number systems", hint: "Decimal, hex, two’s complement" },
        { id: "encoding", name: "Characters & encoding", hint: "ASCII, Unicode, UTF-8" },
        { id: "variables-types", name: "Variables & types", hint: "Values, mutability, type systems" },
        { id: "memory-pointers", name: "Memory & pointers", hint: "Addresses, indirection, heap vs stack" },
        { id: "big-o", name: "Big-O complexity", hint: "How cost grows with input size" }
      ]
    },
    {
      id: "data-structures",
      label: "Data structures",
      concepts: [
        { id: "arrays", name: "Arrays", hint: "Contiguous slots, index access" },
        { id: "linked-lists", name: "Linked lists", hint: "Nodes + next pointers" },
        {
          id: "stack",
          name: "Stack",
          hint: "LIFO · push / pop / peek",
          status: "ready"
        },
        { id: "queue", name: "Queue", hint: "FIFO · enqueue / dequeue" },
        { id: "deque", name: "Deque", hint: "Insert and remove at both ends" },
        { id: "hash-tables", name: "Hash tables", hint: "Key → bucket in near-constant time" },
        { id: "sets", name: "Sets", hint: "Unique membership, no duplicates" },
        { id: "maps", name: "Maps / dictionaries", hint: "Key–value lookup" },
        { id: "binary-trees", name: "Binary trees", hint: "Parent with ≤2 children" },
        { id: "bst", name: "Binary search trees", hint: "Ordered tree for fast search" },
        { id: "heaps", name: "Heaps", hint: "Priority at the root" },
        { id: "tries", name: "Tries", hint: "Prefix trees for strings" },
        { id: "balanced-trees", name: "Balanced trees", hint: "AVL, red-black, B-trees" },
        { id: "graphs", name: "Graphs", hint: "Nodes + edges" },
        { id: "priority-queues", name: "Priority queues", hint: "Highest priority first" },
        { id: "union-find", name: "Union-find", hint: "Disjoint sets, connectivity" }
      ]
    },
    {
      id: "algorithms",
      label: "Algorithms",
      concepts: [
        { id: "recursion", name: "Recursion", hint: "A function that calls itself" },
        { id: "call-stack", name: "Call stack", hint: "Frames for nested calls" },
        { id: "searching", name: "Searching", hint: "Linear vs binary search" },
        { id: "sorting", name: "Sorting", hint: "Compare strategies by growth" },
        { id: "divide-conquer", name: "Divide & conquer", hint: "Split, solve, merge" },
        { id: "greedy", name: "Greedy", hint: "Locally best choice each step" },
        { id: "dynamic-programming", name: "Dynamic programming", hint: "Overlap + memoization" },
        { id: "backtracking", name: "Backtracking", hint: "Try, fail, undo" },
        { id: "bfs", name: "Breadth-first search", hint: "Layer by layer with a queue" },
        { id: "dfs", name: "Depth-first search", hint: "Go deep with a stack" },
        { id: "shortest-paths", name: "Shortest paths", hint: "Dijkstra, Bellman-Ford, A*" },
        { id: "mst", name: "Minimum spanning trees", hint: "Kruskal & Prim" },
        { id: "string-algorithms", name: "String algorithms", hint: "Matching, hashing, KMP" },
        { id: "bit-manipulation", name: "Bit manipulation", hint: "Masks, shifts, tricks" }
      ]
    },
    {
      id: "programming",
      label: "Programming models",
      concepts: [
        { id: "oop", name: "Object-oriented programming", hint: "Objects, classes, inheritance" },
        { id: "functional", name: "Functional programming", hint: "Pure functions, immutability" },
        { id: "concurrency", name: "Concurrency", hint: "Many tasks in progress" },
        { id: "parallelism", name: "Parallelism", hint: "Many tasks at once" },
        { id: "threads-processes", name: "Threads & processes", hint: "Units of execution" },
        { id: "synchronization", name: "Synchronization", hint: "Locks, races, atomics" },
        { id: "deadlocks", name: "Deadlocks", hint: "Circular wait forever" }
      ]
    },
    {
      id: "systems",
      label: "Systems",
      concepts: [
        { id: "os-processes", name: "OS processes", hint: "Isolation, scheduling, IPC" },
        { id: "scheduling", name: "CPU scheduling", hint: "Who runs next" },
        { id: "virtual-memory", name: "Virtual memory", hint: "Pages, swaps, address spaces" },
        { id: "caching", name: "Caching", hint: "Locality, hit rates, eviction" },
        { id: "file-systems", name: "File systems", hint: "Files, directories, inodes" },
        { id: "compilers", name: "Compilers & interpreters", hint: "Source → runnable" }
      ]
    },
    {
      id: "networks",
      label: "Networks",
      concepts: [
        { id: "osi-tcpip", name: "Network layers", hint: "OSI & TCP/IP models" },
        { id: "tcp-udp", name: "TCP & UDP", hint: "Reliable vs datagram" },
        { id: "http", name: "HTTP", hint: "Request / response on the web" },
        { id: "dns", name: "DNS", hint: "Names → addresses" },
        { id: "sockets", name: "Sockets", hint: "Endpoints for communication" }
      ]
    },
    {
      id: "databases",
      label: "Databases",
      concepts: [
        { id: "relational", name: "Relational model", hint: "Tables, keys, joins" },
        { id: "sql", name: "SQL", hint: "Querying relational data" },
        { id: "indexes", name: "Indexes", hint: "Speed up lookups" },
        { id: "transactions", name: "Transactions & ACID", hint: "All-or-nothing updates" },
        { id: "nosql", name: "NoSQL models", hint: "Documents, KV, graphs" }
      ]
    },
    {
      id: "security",
      label: "Security basics",
      concepts: [
        { id: "hashing-crypto", name: "Cryptographic hashing", hint: "One-way fingerprints" },
        { id: "encryption", name: "Encryption", hint: "Symmetric vs public-key" },
        { id: "auth", name: "Authentication & authorization", hint: "Who you are / what you may do" }
      ]
    }
  ]
};

(function () {
  function byId(id) {
    var topics = window.__LEARN_CATALOG__.topics;
    for (var t = 0; t < topics.length; t++) {
      var concepts = topics[t].concepts;
      for (var i = 0; i < concepts.length; i++) {
        if (concepts[i].id === id) {
          return Object.assign({ topicId: topics[t].id, topicLabel: topics[t].label }, concepts[i]);
        }
      }
    }
    return null;
  }

  function hrefFor(id, fromConceptPage) {
    var c = byId(id);
    if (!c) return null;
    var prefix = fromConceptPage ? "" : "concepts/";
    if (c.status === "ready") return prefix + c.id + ".html";
    return (fromConceptPage ? "../" : "") + "index.html#" + c.topicId;
  }

  window.__LEARN_CATALOG__.byId = byId;
  window.__LEARN_CATALOG__.hrefFor = hrefFor;
})();
