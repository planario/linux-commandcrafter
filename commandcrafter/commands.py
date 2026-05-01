"""Generic flag/value command definitions. Port of constants.ts COMMANDS."""
from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum
from typing import Iterable


class OptionType(str, Enum):
    FLAG = "flag"
    VALUE = "value"


@dataclass(frozen=True)
class CommandOption:
    name: str
    flag: str
    description: str
    type: OptionType
    placeholder: str = ""


@dataclass(frozen=True)
class CommandArgument:
    name: str
    placeholder: str
    description: str = ""


@dataclass(frozen=True)
class CommandDefinition:
    name: str
    base_command: str
    description: str
    options: tuple[CommandOption, ...] = field(default_factory=tuple)
    args: tuple[CommandArgument, ...] = field(default_factory=tuple)


def _opts(items: Iterable[CommandOption]) -> tuple[CommandOption, ...]:
    return tuple(items)


def _args(items: Iterable[CommandArgument]) -> tuple[CommandArgument, ...]:
    return tuple(items)


COMMANDS: tuple[CommandDefinition, ...] = (
    CommandDefinition(
        name="mv",
        base_command="mv",
        description="Move or rename files and directories.",
        args=_args([
            CommandArgument("Source", "/path/to/source", "The file or directory you want to move or rename."),
            CommandArgument("Destination", "/path/to/destination", "The new location or new name for the source."),
        ]),
        options=_opts([
            CommandOption("interactive", "-i, --interactive", "Prompt before overwriting an existing file.", OptionType.FLAG),
            CommandOption("force", "-f, --force", "Do not prompt before overwriting (overrides -i).", OptionType.FLAG),
            CommandOption("no-clobber", "-n, --no-clobber", "Do not overwrite an existing file.", OptionType.FLAG),
            CommandOption("verbose", "-v, --verbose", "Explain what is being done.", OptionType.FLAG),
            CommandOption("update", "-u, --update", "Move only when the SOURCE file is newer than the destination file or when the destination file is missing.", OptionType.FLAG),
            CommandOption("backup", "--backup", "Make a backup of each existing destination file.", OptionType.VALUE, "none, off, numbered, t, existing, simple"),
            CommandOption("strip-trailing-slashes", "--strip-trailing-slashes", "Remove trailing slashes from each SOURCE argument.", OptionType.FLAG),
            CommandOption("no-target-directory", "-T, --no-target-directory", "Treat DESTINATION as a normal file, not a directory.", OptionType.FLAG),
        ]),
    ),
    CommandDefinition(
        name="cp",
        base_command="cp",
        description="Copy files and directories.",
        args=_args([
            CommandArgument("Source", "/path/to/source", "The file or directory you want to copy."),
            CommandArgument("Destination", "/path/to/destination", "The location where the copy will be created."),
        ]),
        options=_opts([
            CommandOption("recursive", "-r, -R, --recursive", "Copies directories and their entire contents.", OptionType.FLAG),
            CommandOption("interactive", "-i, --interactive", "Prompt for confirmation before overwriting any existing file.", OptionType.FLAG),
            CommandOption("force", "-f, --force", "Remove destination file that cannot be opened for writing and try again.", OptionType.FLAG),
            CommandOption("verbose", "-v, --verbose", "Prints the name of each file as it is copied.", OptionType.FLAG),
            CommandOption("archive", "-a, --archive", "Equivalent to -dR --preserve=all.", OptionType.FLAG),
            CommandOption("update", "-u, --update", "Only copies if the source is newer than the destination.", OptionType.FLAG),
            CommandOption("symbolic-link", "-s, --symbolic-link", "Create symbolic links instead of copying the files themselves.", OptionType.FLAG),
            CommandOption("preserve", "--preserve", "Preserve the specified attributes (e.g., mode,timestamps).", OptionType.VALUE, "mode,timestamps"),
            CommandOption("no-clobber", "-n, --no-clobber", "Do not overwrite an existing file.", OptionType.FLAG),
            CommandOption("link", "-l, --link", "Create hard links to files instead of copying.", OptionType.FLAG),
        ]),
    ),
    CommandDefinition(
        name="tar",
        base_command="tar",
        description="Archiving utility to create, manage, and extract tar archives.",
        args=_args([
            CommandArgument("Archive Name", "archive.tar", "The name of the archive file."),
            CommandArgument("Files / Directories", "file1.txt dir1/ ...", "Space-separated list of files or directories."),
        ]),
        options=_opts([
            CommandOption("create", "-c, --create", "Create a new archive.", OptionType.FLAG),
            CommandOption("extract", "-x, --extract", "Extract files from an archive.", OptionType.FLAG),
            CommandOption("list", "-t, --list", "List the contents of an archive without extracting.", OptionType.FLAG),
            CommandOption("file", "-f, --file", "Specifies the archive file name.", OptionType.FLAG),
            CommandOption("verbose", "-v, --verbose", "Verbosely list files as they are processed.", OptionType.FLAG),
            CommandOption("gzip", "-z, --gzip", "Filter through gzip (.tar.gz).", OptionType.FLAG),
            CommandOption("bzip2", "-j, --bzip2", "Filter through bzip2 (.tar.bz2).", OptionType.FLAG),
            CommandOption("xz", "-J, --xz", "Filter through xz (.tar.xz).", OptionType.FLAG),
            CommandOption("use-compress-program", "--use-compress-program", "Use a custom compressor (e.g., pigz).", OptionType.VALUE, "pigz"),
            CommandOption("exclude", "--exclude", "Exclude files matching a pattern during creation.", OptionType.VALUE, "PATTERN"),
            CommandOption("strip-components", "--strip-components", "On extraction, remove this many leading directory levels.", OptionType.VALUE, "NUMBER"),
            CommandOption("remove-files", "--remove-files", "Delete files from the disk after adding them to the archive.", OptionType.FLAG),
        ]),
    ),
    CommandDefinition(
        name="gzip",
        base_command="gzip",
        description="Compress or expand files.",
        args=_args([
            CommandArgument("File", "/path/to/file", "The file to compress or decompress."),
        ]),
        options=_opts([
            CommandOption("decompress", "-d, --decompress", "Decompress the file.", OptionType.FLAG),
            CommandOption("force", "-f, --force", "Force compression or decompression.", OptionType.FLAG),
            CommandOption("keep", "-k, --keep", "Keep input files during compression or decompression.", OptionType.FLAG),
            CommandOption("list", "-l, --list", "List compressed file contents.", OptionType.FLAG),
            CommandOption("verbose", "-v, --verbose", "Display name and percentage reduction.", OptionType.FLAG),
            CommandOption("fast", "--fast", "Compress faster (less compression).", OptionType.FLAG),
            CommandOption("best", "--best", "Compress better (slower).", OptionType.FLAG),
            CommandOption("recursive", "-r, --recursive", "Operate recursively on directories.", OptionType.FLAG),
            CommandOption("test", "-t, --test", "Test the integrity of the compressed file.", OptionType.FLAG),
        ]),
    ),
)


def find_command(name: str) -> CommandDefinition | None:
    for cmd in COMMANDS:
        if cmd.name == name:
            return cmd
    return None
