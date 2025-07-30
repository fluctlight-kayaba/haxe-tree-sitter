class ArrowTest {
    static function main() {
        // Examples from haxe-TmLanguage test cases
        () -> 1;
        (?a:Int) -> a;
        (a:Int=1, b:String) -> a + b.length;
        map = [1 => a -> a + a, 2 => a -> a + a, 3 => a -> a + a];
        (() -> 1:Void->Int);

        // More complex examples
        var f1 = () -> "hello";
        var f2 = (x) -> x * 2;
        var f3 = (x:Int, y:Int) -> x + y;
        var f4 = (name:String="default") -> "Hello " + name;
        
        // In function calls
        [1, 2, 3].map(x -> x * 2);
        items.filter(item -> item.length > 5);
    }
}
