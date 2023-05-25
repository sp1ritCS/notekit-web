## Syntax highlighting
Polyglot syntax highlighting in Markdown triple-backtick spans can be enabled by flipping the appropriate switch in the Preferences window.

**C++:**
```cpp
// no comment is also a comment
template<class T> struct Container {
	T data;
};
int main(int argc, char* argv[]) {
	while(1);
}
```

**Haskell:**
```haskell
data Tree a = Leaf | Node (Tree a) (Tree a) a

traverse Leaf = []
traverse (Node l r v) = v:(traverse l)++(traverse r)

facs = scanl (*) 1 [1..]
```

**SQL:**
```sql
SELECT t.*,f.* FROM threads t
               LEFT JOIN forums f ON f.id=t.forum
	       WHERE f.id='10' ORDER BY t.id LIMIT 10;
```