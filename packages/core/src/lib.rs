use wasm_bindgen::prelude::*;

// When the `wee_alloc` feature is enabled, use `wee_alloc` as the global
// allocator.
#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

#[wasm_bindgen]
extern "C" {
    fn alert(s: &str);
}

fn make_greeting(name: &str) -> String {
    format!("Hello {}!", name)
}

#[wasm_bindgen]
pub fn greet(name: Option<String>) {
    let actual_name = name.unwrap_or_else(|| "stranger".into());

    alert(&make_greeting(&actual_name));
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn it_works() {
        assert_eq!(2 + 2, 4);
    }

    #[test]
    fn it_makes_greeting() {
        let greeting = &make_greeting("world");

        assert_eq!(greeting, "Hello world!");
    }
}
