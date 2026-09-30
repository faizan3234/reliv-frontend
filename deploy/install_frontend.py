#!/usr/bin/env python3
"""Validate a complete Vite build, copy assets first, publish index.html last."""
import argparse
import json
import os
from pathlib import Path
import shutil
import tempfile


def build_files(source):
    source = Path(source).resolve()
    manifest = json.loads((source / '.vite/manifest.json').read_text())
    if 'index.html' not in manifest:
        raise ValueError('Missing Vite index.html entry; run npm run build first.')
    required = {'index.html'}
    for entry in manifest.values():
        required.add(entry['file'])
        required.update(entry.get('css', []))
        required.update(entry.get('assets', []))
        for dependency in entry.get('imports', []) + entry.get('dynamicImports', []):
            if dependency not in manifest:
                raise ValueError('Missing manifest dependency: ' + dependency)
    for name in required:
        path = source / name
        if not path.resolve().is_relative_to(source) or not path.is_file() or not path.stat().st_size:
            raise ValueError('Missing/empty/invalid build asset: ' + name)
    files = []
    for path in source.rglob('*'):
        if path.is_symlink():
            raise ValueError('Build symlinks are not supported: ' + str(path))
        if path.is_file() and '.vite' not in path.relative_to(source).parts:
            files.append(path.relative_to(source))
    return source, files


def copy_atomic(source, target):
    target.parent.mkdir(parents=True, exist_ok=True)
    fd, temporary = tempfile.mkstemp(prefix='.reliv-install-', dir=target.parent)
    try:
        with os.fdopen(fd, 'wb') as output, source.open('rb') as input_file:
            shutil.copyfileobj(input_file, output)
            output.flush()
            os.fsync(output.fileno())
        os.chmod(temporary, 0o644)
        os.replace(temporary, target)
    finally:
        if os.path.exists(temporary):
            os.unlink(temporary)


def deploy(source, destination):
    source, files = build_files(source)  # Fail before modifying the served site.
    destination = Path(destination).resolve()
    if destination == source or destination.is_relative_to(source) or source.is_relative_to(destination):
        raise ValueError('Build and web root must be separate directories.')
    for relative in files:
        if not (destination / relative).resolve().is_relative_to(destination):
            raise ValueError('Web root contains an external symlink: ' + str(relative))
    # Keep old hashed assets for tabs that still run an earlier JS bundle.
    for relative in sorted(files):
        if relative != Path('index.html'):
            copy_atomic(source / relative, destination / relative)
    # New HTML is only visible after all its resources have been published.
    copy_atomic(source / 'index.html', destination / 'index.html')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source', default=str(Path(__file__).resolve().parents[1] / 'dist'))
    parser.add_argument('--target', default='/var/www/reliv')
    parser.add_argument('--check', action='store_true', help='Validate source build only; do not deploy')
    args = parser.parse_args()
    if args.check:
        _, files = build_files(args.source)
        print(f'Build validated: {len(files)} files.')
    else:
        deploy(args.source, args.target)
        print('Frontend installed. All assets copied before index.html; old assets preserved.')
        print('Reopen http://192.168.50.1/?reliv_reload=css-fix')


if __name__ == '__main__':
    try:
        main()
    except (OSError, ValueError, KeyError, TypeError) as error:
        raise SystemExit('ERROR: ' + str(error))
