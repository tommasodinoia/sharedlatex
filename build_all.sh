#!/bin/bash
set -e

echo "\n"
echo "************************************************************"
echo "*"
echo "* ASSICURATI DI AVERE QUESTA STRUTTURA DI CARTELLE:"
echo "*"
echo "* texlive-iso-cache/"
echo "* texlive-script-cache/"
echo "* texlive-source-cache/"
echo "* ubuntu-texlive-package-files-list/"
echo "*"
echo "* premi invio per continuare"
echo "*"
read -p "************************************************************"
echo "\n"



# Clona il repository se non esiste già
if [ ! -d "TexWallerLogic" ]; then
  echo "==[ Cloning TexWaller/TexWallerLogic ]=="
  gh repo clone TexWaller/TexWallerLogic
fi

echo "\n"
echo "************************************************************"
echo "*"
echo "* REPOSITORY CLONATO"
echo "* ADESSO COPIO I FILE DI CACHE NELLA CARTELLA TexWallerLogic"
echo "* premi invio per continuare"
echo "*"
read -p "************************************************************"
echo "\n"
# Entra nella cartella del progetto
cd TexWallerLogic || exit 1

# Crea le directory di cache se non esistono
mkdir -p texlive-iso-cache
mkdir -p texlive-script-cache
mkdir -p texlive-source-cache
mkdir -p ubuntu-texlive-package-files-list

# Copia ogni file in ../texlive-iso-cache
for f in ../texlive-iso-cache/*; do
  [ -e "$f" ] && cp "$f" texlive-iso-cache/
  # Se vuoi evitare errori su file non esistenti, puoi aggiungere: [ -e "$f" ] || continue
  # Se vuoi solo file regolari: [ -f "$f" ] && ln -sf "$f" texlive-iso-cache/
done

# Copia ogni file in ../texlive-script-cache
for f in ../texlive-script-cache/*; do
  [ -e "$f" ] && cp "$f" texlive-script-cache/
  # Se vuoi evitare errori su file non esistenti, puoi aggiungere: [ -e "$f" ] || continue
  # Se vuoi solo file regolari: [ -f "$f" ] && ln -sf "$f" texlive-script-cache/
done

# Copia ogni file in ../texlive-source-cache
for f in ../texlive-source-cache/*; do
  [ -e "$f" ] && cp "$f" texlive-source-cache/
  # Se vuoi evitare errori su file non esistenti, puoi aggiungere: [ -e "$f" ] || continue
  # Se vuoi solo file regolari: [ -f "$f" ] && ln -sf "$f" texlive-source-cache/
done

# Copia ogni file in ../ubuntu-texlive-package-files-list
for f in ../ubuntu-texlive-package-files-list/*; do
  [ -e "$f" ] && cp "$f" ubuntu-texlive-package-files-list/
  # Se vuoi evitare errori su file non esistenti, puoi aggiungere: [ -e "$f" ] || continue
  # Se vuoi solo file regolari: [ -f "$f" ] && ln -sf "$f" ubuntu-texlive-package-files-list/
done

echo "\n"
echo "************************************************************"
echo "*"
echo "* HO COPIATO I FILE DI CACHE: premi invio per continuare"
echo "*"
read -p "************************************************************"
echo "\n"

# --- Build Native ---
echo "==[ Build Native ]=="
# Install prerequisites (Alpine syntax, adattare se necessario)
if command -v apk &> /dev/null; then
  apk add --update --no-cache libnsl libnsl-dev build-base coreutils cmake bash git xz wget perl gperf p7zip python3 github-cli strace libarchive-tools curl || true
else
  sudo apt-get update
  sudo apt-get install -y xz-utils strace cmake unzip gh gperf
fi

echo "\n"
echo "************************************************************"
echo "*"
echo "* SISTEMA AGGIORNATO: premi invio per continuare"
echo "*"
read -p "************************************************************"
echo "\n"

# Clone TexLive and dependencies
make source/texlive.txt build/versions.txt

echo "\n"
echo "************************************************************"
echo "*"
echo "* TEXLIVE E SUE DIPENDENZE CLONATE"
echo "* ADESSO SCARICO LA LISTA DI FILE DEI PACCHETTI UBUNTU (COMMENTATO))"
echo ": premi invio per continuare"
echo "*"
read -p "************************************************************"
echo "\n"

# Download Ubuntu package file lists (commented in workflow, attivata qui)
#UBUNTU="https://packages.ubuntu.com/noble/"
#UBUNTUPACKAGES="texlive-latex-extra texlive-latex-base texlive-latex-recommended texlive-science texlive-fonts-recommended texlive-pictures texlive-humanities texlive-publishers"
#for UBUNTUPACKAGE in $UBUNTUPACKAGES; do
#  python3 ubuntu_package_preload.py --url $UBUNTU --package $UBUNTUPACKAGE --ubuntu-log $UBUNTUPACKAGE.txt
#done

echo "\n"
echo "************************************************************"
echo "*"
echo "* LISTA DEI PACCHETTI UBUNTU SCARICATA"
echo "* CONTROLLA I FILE nome_package.txt"
echo "*"
echo "* ORA FACCIO PARTIRE LA COMPILAZIONE NATIVE"
echo ": premi invio per continuare"
echo "*"
read -p "************************************************************"
echo "\n"

# Build native busytex
make native

echo "\n"
echo "************************************************************"
echo "*"
echo "* COMPILAZIONE NATIVE COMPLETATA"
echo "* ADESSO ESEGUIRÒ I TEST"
echo ": premi invio per continuare"
echo "*"
read -p "************************************************************"
echo "\n"

# Smoke and test native
make smoke-native

echo "\n"
echo "************************************************************"
echo "*"
echo "* SMOKE TEST COMPLETATI"
echo ": premi invio per continuare"
echo "*"
read -p "************************************************************"
echo "\n"

make source/texmfrepo.txt

echo "\n"
echo "************************************************************"
echo "*"
echo "* HO CREATO IL FILE source/texmfrepo.txt CON LA LISTA "
echo "* DEI FILE DI TEXLIVE"
echo ": premi invio per continuare"
echo "*"
read -p "************************************************************"
echo "\n"

make build/texlive-basic.txt

echo "\n"
echo "************************************************************"
echo "*"
echo "* HO COPIATO I FILE NELLA LISTA NELLE CARTELLE"
echo "* DI DESTINAZIONE"
echo ": premi invio per continuare"
echo "*"
read -p "************************************************************"
echo "\n"

mkdir -p dist-native
ln -sf "$PWD/build/native/busytex" dist-native/busytex
ln -sf "$PWD/build/texlive-basic" dist-native/texlive-dist

echo "\n"
echo "************************************************************"
echo "*"
echo "* HO CREATO I LINK SIMBOLICI PER I BINARI"
echo "* busytex E texlive-dist NELLA CARTELLA dist-native"
echo "*"
echo "* ADESSO ESEGUIRÒ I TEST CON EXAMPLE con pdftex E bibtex"
echo ": premi invio per continuare"
echo "*"
read -p "************************************************************"
echo "\n"

PATH="$PWD/dist-native:$PATH" bash example/example.sh busytex pdflatex bibtex

echo "\n"
echo "************************************************************"
echo "*"
echo "* TEST busytex CON EXAMPLE CON PDFTEX E BIBTEX COMPLETATO"
echo "* ADESSO ESEGUIRÒ I TEST CON EXAMPLE CON busytexextra"
echo ": premi invio per continuare"
echo "*"
read -p "************************************************************"
echo "\n"

make build/texlive-extra.txt
make build/native/busytexextra
PATH="$PWD/build/native:$PATH" bash example/example.sh busytexextra pdflatex bibtex

echo "\n"
echo "************************************************************"
echo "*"
echo "* TEST busytexextra CON EXAMPLE CON PDFTEX E BIBTEX COMPLETATO"
echo "* ADESSO ESEGUIRÒ I TEST CON EXAMPLE CON busytexextra"
echo ": premi invio per continuare"
echo "*"
read -p "************************************************************"
echo "\n"

echo "\n"
echo "************************************************************"
echo "*"
echo "* CREO UNA DISTRIBUZIONE AUTOCONSISTENTE DI busytex "
echo "* USANDO dist_locale.sh"
echo ": premi invio per continuare"
echo "*"
read -p "************************************************************"
echo "\n"

# Test native script
bash example/dist_locale.sh
find ./texlive-dist/ -name '*.fmt'

echo "\n"
echo "************************************************************"
echo "*"
echo "* ESEGUO LA COMPILAZIONE CON busytex AUTOCONSISTENTE"
echo ": premi invio per continuare"
echo "*"
read -p "************************************************************"
echo "\n"


PATH="$PWD:$PATH" bash example/example.sh busytex pdflatex bibtex


echo "\n"
echo "************************************************************"
echo "*"
echo "* COMPILAZIONE CON busytex AUTOCONSISTENTE COMPLETATA"
echo ": premi invio per continuare"
echo "*"
read -p "************************************************************"
echo "\n"

echo "\n"
echo "************************************************************"
echo "*"
echo "* A QUESTO PUNTO DI ASSUME CHE I BINARI SIANO IN "
echo "* build/native/texlive/texk/web2c/web2c"
echo "* VERIFICHIAMO CHE SIANO PRESENTI"
echo ": premi invio per continuare"
echo "*"
read -p "************************************************************"
echo "\n"

ls -R build/native/

echo "\n"
echo "************************************************************"
echo "*"
echo "* ORA DEDICHIAMOCI AL BUILD WASM"
echo ": premi invio per continuare"
echo "*"
read -p "************************************************************"
echo "\n"

# --- Build WASM ---
echo "==[ Build WASM ]=="
# Install prerequisites for WASM build
sudo apt-get install -y gperf p7zip-full strace icu-devtools

echo "\n"
echo "************************************************************"
echo "*"
echo "* HO INSTALLATO I PREREQUISITI PER LA COMPILAZIONE WASM"
echo "* ORA CREO LA STRUTTURA DELLE CARTELLE"
echo ": premi invio per continuare"
echo "*"
read -p "************************************************************"
echo "\n"


# Simula "Download native binaries" usando i binari già generati
mkdir -p source build/native build/native/texlive/texk/web2c/web2c
# Qui si presume che i binari siano già in build/native/...
# Se necessario, aggiungi eventuali link/symlink come nel Makefile
mkdir -p build/native/texlive/libs/icu/icu-build/bin build/native/texlive/libs/freetype2/ft-build
rm -f build/native/texlive/libs/icu/icu-build/bin/icupkg build/native/texlive/libs/icu/icu-build/bin/pkgdata build/native/texlive/libs/freetype2/ft-build/apinames
ln -sf "$(which icupkg)" build/native/texlive/libs/icu/icu-build/bin/
ln -sf "$(which pkgdata)" build/native/texlive/libs/icu/icu-build/bin/
chmod +x build/native/texlive/texk/web2c/pdftex build/native/texlive/texk/web2c/web2c/pdftex || true

# Download TexLive Full
make source/texmfrepo.txt

echo "\n"
echo "************************************************************"
echo "*"
echo "* HO RI-CREATO IL FILE source/texmfrepo.txt CON LA LISTA "
echo "* DEI FILE DI TEXLIVE"
echo ": premi invio per continuare"
echo "*"
read -p "************************************************************"
echo "\n"


# Install TexLive
make build/texlive-basic.txt build/texlive-full.txt

# Clean-up texmf sources
rm -rf source/texmfrepo

# Setup Emscripten (usa emsdk install se locale, oppure setup-emsdk@v13 se in CI)
EMSCRIPTEN_VERSION=3.1.43
if [ -d "$HOME/emsdk" ]; then
  source "$HOME/emsdk/emsdk_env.sh"
else
  echo "Installa emsdk manualmente o usa il setup CI"
fi

# Clone/patch TexLive and dependencies
make source/texlive.txt build/versions.txt

echo "\n"
echo "************************************************************"
echo "*"
echo "* ESEGUO MAKE WASM"
echo "* DEI FILE DI TEXLIVE"
echo ": premi invio per continuare"
echo "*"
read -p "************************************************************"
echo "\n"

# Build wasm busytex
make wasm

echo "\n"
echo "************************************************************"
echo "*"
echo "* ORA CREAO I PACCHETTI WASM"
echo ": premi invio per continuare"
echo "*"
read -p "************************************************************"
echo "\n"

# Create packages and dist
make build/wasm/texlive-basic.js
make -e TEXMFFULL=build/texlive-full $(printf "build/wasm/ubuntu/%s.js " $UBUNTUPACKAGES)
make dist-wasm

echo "==[ Build completed ]=="
