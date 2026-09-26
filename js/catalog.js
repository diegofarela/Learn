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
        {
          id: "binary-bits",
          name: "Binary & bits",
          hint: "Base-2, places, flipping bits",
          status: "ready"
        },
        {
          id: "boolean-logic",
          name: "Boolean logic",
          hint: "AND, OR, NOT, truth tables",
          status: "ready"
        },
        {
          id: "number-systems",
          name: "Number systems",
          hint: "Decimal, hex, two’s complement",
          status: "ready"
        },
        {
          id: "encoding",
          name: "Characters & encoding",
          hint: "ASCII, Unicode, UTF-8",
          status: "ready"
        },
        {
          id: "variables-types",
          name: "Variables & types",
          hint: "Values, mutability, type systems",
          status: "ready"
        },
        {
          id: "memory-pointers",
          name: "Memory & pointers",
          hint: "Addresses, indirection, heap vs stack",
          status: "ready"
        },
        {
          id: "big-o",
          name: "Big-O complexity",
          hint: "How cost grows with input size",
          status: "ready"
        }
      ]
    },
    {
      id: "data-structures",
      label: "Data structures",
      concepts: [
        {
          id: "arrays",
          name: "Arrays",
          hint: "Contiguous slots, index access",
          status: "ready"
        },
        {
          id: "linked-lists",
          name: "Linked lists",
          hint: "Nodes + next pointers",
          status: "ready"
        },
        {
          id: "stack",
          name: "Stack",
          hint: "LIFO · push / pop / peek",
          status: "ready"
        },
        {
          id: "queue",
          name: "Queue",
          hint: "FIFO · enqueue / dequeue",
          status: "ready"
        },
        {
          id: "deque",
          name: "Deque",
          hint: "Insert and remove at both ends",
          status: "ready"
        },
        {
          id: "hash-tables",
          name: "Hash tables",
          hint: "Key → bucket in near-constant time",
          status: "ready"
        },
        {
          id: "sets",
          name: "Sets",
          hint: "Unique membership, no duplicates",
          status: "ready"
        },
        {
          id: "maps",
          name: "Maps / dictionaries",
          hint: "Key–value lookup",
          status: "ready"
        },
        {
          id: "binary-trees",
          name: "Binary trees",
          hint: "Parent with ≤2 children",
          status: "ready"
        },
        {
          id: "bst",
          name: "Binary search trees",
          hint: "Ordered tree for fast search",
          status: "ready"
        },
        {
          id: "heaps",
          name: "Heaps",
          hint: "Priority at the root",
          status: "ready"
        },
        {
          id: "tries",
          name: "Tries",
          hint: "Prefix trees for strings",
          status: "ready"
        },
        {
          id: "balanced-trees",
          name: "Balanced trees",
          hint: "AVL, red-black, B-trees",
          status: "ready"
        },
        {
          id: "graphs",
          name: "Graphs",
          hint: "Nodes + edges",
          status: "ready"
        },
        {
          id: "priority-queues",
          name: "Priority queues",
          hint: "Highest priority first",
          status: "ready"
        },
        {
          id: "union-find",
          name: "Union-find",
          hint: "Disjoint sets, connectivity",
          status: "ready"
        },
        {
          id: "bloom-filters",
          name: "Bloom filters",
          hint: "Probabilistic set, false positives",
          status: "ready"
        }
      ]
    },
    {
      id: "algorithms",
      label: "Algorithms",
      concepts: [
        {
          id: "recursion",
          name: "Recursion",
          hint: "A function that calls itself",
          status: "ready"
        },
        {
          id: "call-stack",
          name: "Call stack",
          hint: "Frames for nested calls",
          status: "ready"
        },
        {
          id: "searching",
          name: "Searching",
          hint: "Linear vs binary search",
          status: "ready"
        },
        {
          id: "sorting",
          name: "Sorting",
          hint: "Compare strategies by growth",
          status: "ready"
        },
        {
          id: "divide-conquer",
          name: "Divide & conquer",
          hint: "Split, solve, merge",
          status: "ready"
        },
        {
          id: "greedy",
          name: "Greedy",
          hint: "Locally best choice each step",
          status: "ready"
        },
        {
          id: "dynamic-programming",
          name: "Dynamic programming",
          hint: "Overlap + memoization",
          status: "ready"
        },
        {
          id: "backtracking",
          name: "Backtracking",
          hint: "Try, fail, undo",
          status: "ready"
        },
        {
          id: "bfs",
          name: "Breadth-first search",
          hint: "Layer by layer with a queue",
          status: "ready"
        },
        {
          id: "dfs",
          name: "Depth-first search",
          hint: "Go deep with a stack",
          status: "ready"
        },
        {
          id: "shortest-paths",
          name: "Shortest paths",
          hint: "Dijkstra, Bellman-Ford, A*",
          status: "ready"
        },
        {
          id: "mst",
          name: "Minimum spanning trees",
          hint: "Kruskal & Prim",
          status: "ready"
        },
        {
          id: "string-algorithms",
          name: "String algorithms",
          hint: "Matching, hashing, KMP",
          status: "ready"
        },
        {
          id: "bit-manipulation",
          name: "Bit manipulation",
          hint: "Masks, shifts, tricks",
          status: "ready"
        },
        {
          id: "regex",
          name: "Regular expressions",
          hint: "Pattern matching over text",
          status: "ready"
        }
      ]
    },
    {
      id: "programming",
      label: "Programming models",
      concepts: [
        {
          id: "oop",
          name: "Object-oriented programming",
          hint: "Objects, classes, inheritance",
          status: "ready"
        },
        {
          id: "functional",
          name: "Functional programming",
          hint: "Pure functions, immutability",
          status: "ready"
        },
        {
          id: "concurrency",
          name: "Concurrency",
          hint: "Many tasks in progress",
          status: "ready"
        },
        {
          id: "parallelism",
          name: "Parallelism",
          hint: "Many tasks at once",
          status: "ready"
        },
        {
          id: "threads-processes",
          name: "Threads & processes",
          hint: "Units of execution",
          status: "ready"
        },
        {
          id: "synchronization",
          name: "Synchronization",
          hint: "Locks, races, atomics",
          status: "ready"
        },
        {
          id: "deadlocks",
          name: "Deadlocks",
          hint: "Circular wait forever",
          status: "ready"
        }
      ]
    },
    {
      id: "systems",
      label: "Systems",
      concepts: [
        {
          id: "os-processes",
          name: "OS processes",
          hint: "Isolation, scheduling, IPC",
          status: "ready"
        },
        {
          id: "scheduling",
          name: "CPU scheduling",
          hint: "Who runs next",
          status: "ready"
        },
        {
          id: "virtual-memory",
          name: "Virtual memory",
          hint: "Pages, swaps, address spaces",
          status: "ready"
        },
        {
          id: "caching",
          name: "Caching",
          hint: "Locality, hit rates, eviction",
          status: "ready"
        },
        {
          id: "file-systems",
          name: "File systems",
          hint: "Files, directories, inodes",
          status: "ready"
        },
        {
          id: "compilers",
          name: "Compilers & interpreters",
          hint: "Source → runnable",
          status: "ready"
        },
        {
          id: "garbage-collection",
          name: "Garbage collection",
          hint: "Mark/sweep, reclaim unreachable",
          status: "ready"
        }
      ]
    },
    {
      id: "networks",
      label: "Networks",
      concepts: [
        {
          id: "osi-tcpip",
          name: "Network layers",
          hint: "OSI & TCP/IP models",
          status: "ready"
        },
        {
          id: "tcp-udp",
          name: "TCP & UDP",
          hint: "Reliable vs datagram",
          status: "ready"
        },
        {
          id: "http",
          name: "HTTP",
          hint: "Request / response on the web",
          status: "ready"
        },
        {
          id: "dns",
          name: "DNS",
          hint: "Names → addresses",
          status: "ready"
        },
        {
          id: "rest-apis",
          name: "REST APIs",
          hint: "Resources, verbs, status codes",
          status: "ready"
        },
        {
          id: "sockets",
          name: "Sockets",
          hint: "Endpoints for communication",
          status: "ready"
        }
      ]
    },
    {
      id: "databases",
      label: "Databases",
      concepts: [
        {
          id: "relational",
          name: "Relational model",
          hint: "Tables, keys, joins",
          status: "ready"
        },
        {
          id: "sql",
          name: "SQL",
          hint: "Querying relational data",
          status: "ready"
        },
        {
          id: "indexes",
          name: "Indexes",
          hint: "Speed up lookups",
          status: "ready"
        },
        {
          id: "transactions",
          name: "Transactions & ACID",
          hint: "All-or-nothing updates",
          status: "ready"
        },
        {
          id: "nosql",
          name: "NoSQL models",
          hint: "Documents, KV, graphs",
          status: "ready"
        },
        {
          id: "cap-theorem",
          name: "CAP theorem",
          hint: "Consistency, availability, partitions",
          status: "ready"
        }
      ]
    },
    {
      id: "security",
      label: "Security basics",
      concepts: [
        {
          id: "hashing-crypto",
          name: "Cryptographic hashing",
          hint: "One-way fingerprints",
          status: "ready"
        },
        {
          id: "encryption",
          name: "Encryption",
          hint: "Symmetric vs public-key",
          status: "ready"
        },
        {
          id: "auth",
          name: "Authentication & authorization",
          hint: "Who you are / what you may do",
          status: "ready"
        }
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
