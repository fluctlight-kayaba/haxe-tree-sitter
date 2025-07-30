class RegexTest {
    static function main() {
        // Examples from haxe-TmLanguage test cases
        ~/^[1-9]\d{0,2}$/g;
        ~/^Null<(\$\d+)>$/;
        ~/^@(param|default|exception|throws|deprecated|return|returns|since|see)\s+([^@]+)/gm;
        
        // Test in variable assignments
        var pattern1 = ~/test/;
        var pattern2 = ~/pattern/i;
        var pattern3 = ~/complex.*pattern\w+/gim;
        
        // Test in function calls
        trace(~/^\d+$/);
        if (str.match(~/\w+/g)) {
            trace("matches");
        }
    }
}
