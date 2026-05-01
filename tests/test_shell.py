from commandcrafter.shell import shell_quote


def test_simple():
    assert shell_quote("hello") == "'hello'"


def test_spaces():
    assert shell_quote("hello world") == "'hello world'"


def test_single_quote():
    # JS port: 'hello'world  ->  'hello'\''world'
    assert shell_quote("hello'world") == "'hello'\\''world'"


def test_empty():
    assert shell_quote("") == "''"
