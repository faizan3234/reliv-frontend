import importlib.util
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('installer', Path(__file__).with_name('install_frontend.py'))
installer = importlib.util.module_from_spec(spec)
spec.loader.exec_module(installer)


class DeployTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.source = Path(self.temp.name) / 'dist'
        self.target = Path(self.temp.name) / 'site'
        (self.source / '.vite').mkdir(parents=True)
        (self.source / 'assets').mkdir()
        (self.target / 'assets').mkdir(parents=True)
        (self.target / 'index.html').write_text('old html')
        (self.target / 'assets/old.js').write_text('old js')
        (self.source / 'index.html').write_text('new html')
        (self.source / 'assets/new.js').write_text('new js')
        (self.source / 'assets/style.css').write_text('body {color:orange}')
        (self.source / '.vite/manifest.json').write_text(json.dumps({
            'index.html': {'file': 'assets/new.js'}, 'style.css': {'file': 'assets/style.css'}}))

    def test_missing_css_refuses_deploy_and_preserves_live_site(self):
        (self.source / 'assets/style.css').unlink()
        with self.assertRaisesRegex(ValueError, 'style.css'):
            installer.deploy(self.source, self.target)
        self.assertEqual((self.target / 'index.html').read_text(), 'old html')
        self.assertFalse((self.target / 'assets/new.js').exists())

    def test_assets_first_html_last_and_old_assets_preserved(self):
        order = []
        original = installer.copy_atomic
        def record(source, target):
            order.append(target.name)
            original(source, target)
        with patch.object(installer, 'copy_atomic', side_effect=record):
            installer.deploy(self.source, self.target)
        self.assertEqual(order[-1], 'index.html')
        self.assertTrue((self.target / 'assets/old.js').exists())
        self.assertEqual((self.target / 'index.html').read_text(), 'new html')

    def test_asset_copy_failure_keeps_previous_html(self):
        with patch.object(installer, 'copy_atomic', side_effect=OSError('disk full')):
            with self.assertRaises(OSError):
                installer.deploy(self.source, self.target)
        self.assertEqual((self.target / 'index.html').read_text(), 'old html')


if __name__ == '__main__':
    unittest.main()
