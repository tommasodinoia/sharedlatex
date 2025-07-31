#!/usr/bin/env python3
"""
ubuntu_package_preload.py

Script per generare file di preload per pacchetti Ubuntu TexLive in formato WASM.
Questo script scarica le liste di file dai pacchetti Ubuntu, analizza il contenuto
e genera i parametri --preload necessari per il file_packager di Emscripten.

Uso principale:
1. Scarica liste di file da packages.ubuntu.com o da cache remoto
2. Filtra i file TexLive rilevanti (/usr/share/texlive/texmf-dist/*)
3. Mappa i percorsi dal filesystem locale al target WASM
4. Genera argomenti --preload per file_packager.py

Autore: BusyTeX Project
"""

import os
import sys
import time
import argparse
import urllib.request
import html.parser

class UbuntuDebFileList(html.parser.HTMLParser):
    """
    Parser HTML per estrarre liste di file dalle pagine packages.ubuntu.com
    
    Le pagine di Ubuntu packages contengono liste di file all'interno di tag <pre>.
    Questo parser estrae il contenuto di questi tag e lo converte in una lista
    di percorsi di file.
    """
    def __init__(self):
        super().__init__()
        self.file_list = None

    def handle_starttag(self, tag, attrs):
        """Inizia la raccolta quando trova un tag <pre>"""
        if tag == 'pre':
            self.file_list = []

    def handle_data(self, data):
        """Estrae i percorsi di file dal contenuto del tag <pre>"""
        if self.file_list == []:
            self.file_list.extend(filter(None, data.split('\n')))

def makedirs_open(path, mode):
    """
    Crea le directory necessarie e apre un file
    
    Args:
        path (str): Percorso del file da aprire
        mode (str): Modalità di apertura del file ('w', 'r', 'wb', etc.)
    
    Returns:
        file object: Handle del file aperto
    """
    dirname = os.path.dirname(path)
    if dirname:
        os.makedirs(dirname, exist_ok = True)
    return open(path, mode)

def generate_preload(texmf_src, package_file_list, skip, varlog, skip_log = None, good_log = None, providespackage_log = None, texmf_dst = '/texmf', texmf_ubuntu = '/usr/share/texlive', texmf_dist = '/usr/share/texlive/texmf-dist'):
    """
    Genera le mappature di preload per file_packager di Emscripten
    
    Questa funzione è il cuore dello script. Prende una lista di file da un pacchetto Ubuntu
    e genera le mappature necessarie per includere i file TexLive nel pacchetto WASM.
    
    Args:
        texmf_src (str): Directory sorgente del texmf locale (es: 'build/texlive-full')
        package_file_list (list): Lista di percorsi di file dal pacchetto Ubuntu
        skip (list): Lista di prefissi di percorsi da ignorare (es: '/usr/bin', '/usr/share/doc')
        varlog (str): Directory per file di log
        skip_log (str): File di log per file saltati
        good_log (str): File di log per file inclusi
        providespackage_log (str): File di log per package declarations LaTeX
        texmf_dst (str): Percorso di destinazione nel WASM (default: '/texmf')
        texmf_ubuntu (str): Prefisso Ubuntu da rimuovere (default: '/usr/share/texlive')
        texmf_dist (str): Prefisso per file TexLive (default: '/usr/share/texlive/texmf-dist')
    
    Returns:
        set: Set di tuple (src_path, dst_path) per --preload arguments
    """
    preload = set()
    print(f'Skip log in [{skip_log or "stderr"}]', file = sys.stderr)
    
    # Aggiungi il file di skip log stesso al preload se specificato
    if skip_log:
        preload.add((skip_log, os.path.join(varlog, os.path.basename(skip_log))))
   
    # Apri i file di log (usa stderr come fallback)
    skip_log = makedirs_open(skip_log, 'w') if skip_log else sys.stderr
    providespackage_log = makedirs_open(providespackage_log, 'wb') if providespackage_log else sys.stderr.buffer
    good_log = makedirs_open(good_log, 'w') if good_log else sys.stderr
    
    # Salva tutti i file del pacchetto nel good_log
    good_log.writelines(path + '\n' for path in package_file_list)

    # Processa ogni file nella lista del pacchetto
    for path in package_file_list:
        # Salta file che matchano i prefissi da ignorare
        if any(map(path.startswith, skip)):
            continue

        # Processa solo file TexLive (/usr/share/texlive/texmf-dist/*)
        if not path.startswith(texmf_dist):
            print(path, file = skip_log)
            continue

        dirname = os.path.dirname(path)
        # Mappa dal percorso Ubuntu al percorso locale
        src_path = path.replace(texmf_ubuntu, texmf_src)

        # Verifica che il file esista nel texmf locale
        if not os.path.exists(src_path):
            print(path, file = skip_log)
            continue
        
        # Estrae dichiarazioni \ProvidesPackage dal file LaTeX
        providespackage_log.writelines(b'// ' + line.strip() + b'\n' for line in open(src_path, 'rb') if b'\\ProvidesPackage' in line)

        # Genera mappatura directory: locale -> WASM
        src_dir = dirname.replace(texmf_ubuntu, texmf_src)
        dst_dir = dirname.replace(texmf_ubuntu, texmf_dst)
        preload.add((src_dir, dst_dir))

    return preload

def fetch_ubuntu_package_file_list(ubuntu_release_base_url, package):
    """
    Scarica la lista di file di un pacchetto Ubuntu da packages.ubuntu.com
    
    Args:
        ubuntu_release_base_url (str): URL base (es: 'https://packages.ubuntu.com/noble/')
        package (str): Nome del pacchetto (es: 'texlive-pictures')
    
    Returns:
        list: Lista di percorsi di file contenuti nel pacchetto
    """
    filelist_url = os.path.join(ubuntu_release_base_url, 'all', package, 'filelist')
    print('File list URL', filelist_url, file = sys.stderr)
    
    # Retry logic per gestire errori di rete
    for i in range(args.retry):
        try:
            page = urllib.request.urlopen(filelist_url).read().decode('utf-8')
            break
        except Exception as err:
            assert i < args.retry - 1
            print('Retrying', err, file = sys.stderr)
            time.sleep(args.retry_seconds)
    
    # Parsifica la pagina HTML per estrarre la lista di file
    html_parser = UbuntuDebFileList()
    html_parser.feed(page)
    assert html_parser.file_list is not None
    return html_parser.file_list

def fetch_file_list(base_url, package):
    """
    Scarica o legge la lista di file di un pacchetto
    
    Se base_url è fornito, scarica da URL remoto (cache).
    Altrimenti, legge da file locale.
    
    Args:
        base_url (str): URL base del cache remoto (può essere vuoto)
        package (str): Nome del pacchetto
    
    Returns:
        list: Lista di percorsi di file
    """
    if base_url:
        # Scarica da cache remoto: base_url/package.txt
        return urllib.request.urlopen(os.path.join(base_url, package + '.txt')).read().decode('utf-8').split('\n')
    else:
        # Leggi da file locale
        return open(package, 'r').read().split('\n')

if __name__ == '__main__':
    # Configurazione argomenti da linea di comando
    parser = argparse.ArgumentParser(description='Genera file di preload per pacchetti Ubuntu TexLive')
    parser.add_argument('--texmf', help='Directory texmf locale (es: build/texlive-full)')
    parser.add_argument('--package', nargs = '*', default = [], help='Lista pacchetti da processare')
    #parser.add_argument('--url', required = True, help='URL base per download (packages.ubuntu.com o cache)')
    parser.add_argument('--url', help='URL base per download (packages.ubuntu.com o cache)')
    parser.add_argument('--skip-log', help='File di log per file saltati')
    parser.add_argument('--good-log', help='File di log per file inclusi')
    parser.add_argument('--ubuntu-log', help='File di log per lista completa pacchetto')
    parser.add_argument('--providespackage-log', help='File di log per dichiarazioni LaTeX \\ProvidesPackage')
    parser.add_argument('--skip', nargs = '*', default = ['/usr/bin', '/usr/share/doc', '/usr/share/man'], 
                       help='Prefissi di percorsi da ignorare')
    parser.add_argument('--varlog', default = '/var/log', help='Directory per file di log nel WASM')
    parser.add_argument('--retry', type = int, default = 10, help='Numero di tentativi per download')
    parser.add_argument('--retry-seconds', type = int, default = 60, help='Secondi di attesa tra tentativi')
    parser.add_argument('--path', help='Directory locale contenente i file .txt delle liste pacchetti')
    args = parser.parse_args()

    # AGGIUNTA 
    # Funzione per leggere la lista da file locale se --path è specificato
    def fetch_file_list_local(path_dir, package):
        file_path = os.path.join(path_dir, package + '.txt')
        if not os.path.exists(file_path):
            print(f"File non trovato: {file_path}", file=sys.stderr)
            return []
        return open(file_path, 'r').read().split('\n')
    # FINE AGGIUNTA
    
    # Scarica le liste di file per tutti i pacchetti specificati
    if args.path:
        file_list = list(map(str.strip, filter(bool, sum([fetch_file_list_local(args.path, package) for package in args.package], []))))
    else:
        # Usa fetch_file_list per cache remoto o fetch_ubuntu_package_file_list per packages.ubuntu.com
        file_list = list(map(str.strip, filter(bool, sum([[fetch_file_list, fetch_ubuntu_package_file_list]['packages.ubuntu.com' in args.url](args.url, package) for package in args.package], []))))

    # Salva la lista completa se richiesto
    if args.ubuntu_log:
        f = makedirs_open(args.ubuntu_log, 'w') if args.ubuntu_log != '-' else sys.stdout
        f.writelines(line + '\n' for line in file_list)

    # Genera argomenti --preload per file_packager se texmf è specificato
    if args.texmf:
        preload = generate_preload(args.texmf, file_list, args.skip, skip_log = args.skip_log, good_log = args.good_log, varlog = args.varlog, providespackage_log = args.providespackage_log)
        # Output: --preload src@dst --preload src2@dst2 ...
        print(' '.join(f'--preload {src}@{dst}' for src, dst in preload))

"""
Esempi di utilizzo:

1. Scarica da packages.ubuntu.com e genera preload args:
   python3 ubuntu_package_preload.py --url "https://packages.ubuntu.com/noble/" --package texlive-pictures --texmf build/texlive-full

2. Salva lista di file in cache locale:
   python3 ubuntu_package_preload.py --url "https://packages.ubuntu.com/noble/" --package texlive-pictures --ubuntu-log texlive-pictures.txt

3. Usa cache remoto per generare preload args:
   python3 ubuntu_package_preload.py --url "https://github.com/busytex/busytex/releases/download/texlive2023-20230313.iso/" --package texlive-pictures --texmf build/texlive-full

4. Genera preload per multipli pacchetti:
   python3 ubuntu_package_preload.py --url "https://packages.ubuntu.com/noble/" --package texlive-pictures texlive-latex-extra --texmf build/texlive-full

Output tipico:
--preload build/texlive-full/tex/latex/tikz@/texlive/tex/latex/tikz --preload build/texlive-full/tex/latex/pgf@/texlive/tex/latex/pgf

Questo output viene poi usato da file_packager.py di Emscripten per creare pacchetti .js/.data.
"""
