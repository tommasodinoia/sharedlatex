set -ex

# rm -rf texlive-dist

DIST=texlive-dist
BUSYTEX_native=busytex
BINARCH_native=bin/_custom
TEXDIR=$PWD/$DIST

mkdir -p $DIST/$BINARCH_native && cp dist-native/busytex $DIST/$BINARCH_native/$BUSYTEX_native && chmod +x $DIST/$BINARCH_native/$BUSYTEX_native && ln -s $TEXDIR/$BINARCH_native/$BUSYTEX_native $BUSYTEX_native
mkdir -p $DIST/installer && tar -xzf texlive-script-cache/install-tl-unx.tar.gz --strip-components=1 -C $DIST/installer

for archive in latexconfig.r68923.tar.xz tex-ini-files.r68920.tar.xz texlive-scripts.r73538.tar.xz; do
  tar -xf texlive-script-cache/$archive -C $DIST
done

for name in xetex luahbtex pdftex xelatex luahblatex pdflatex kpsewhich kpseaccess kpsestat kpsereadlink; do printf "#!/bin/sh\n$TEXDIR/$BINARCH_native/busytex $name \$@" > $DIST/$BINARCH_native/$name && chmod +x $DIST/$BINARCH_native/$name; done
for name in updmap.pl fmtutil.pl mktexlsr.pl updmap-sys.sh updmap-user.sh fmtutil-sys.sh fmtutil-user.sh; do cp $DIST/texmf-dist/scripts/texlive/$name $DIST/$BINARCH_native/${name%.*} ; done


echo selected_scheme scheme-basic                    > $DIST/$DIST.profile
echo TEXDIR $TEXDIR                                 >> $DIST/$DIST.profile 
echo TEXMFLOCAL $TEXDIR/texmf-dist/texmf-local      >> $DIST/$DIST.profile 
echo TEXMFSYSVAR $TEXDIR/texmf-dist/texmf-var       >> $DIST/$DIST.profile  
echo TEXMFSYSCONFIG $TEXDIR/texmf-dist/texmf-config >> $DIST/$DIST.profile  
echo "collection-xetex  1"                          >> $DIST/$DIST.profile  
echo "collection-latex  1"                          >> $DIST/$DIST.profile  
echo "collection-luatex 1"                          >> $DIST/$DIST.profile  
TEXLIVE_INSTALL_NO_RESUME=1 perl $DIST/installer/install-tl --profile $DIST/$DIST.profile --custom-bin $TEXDIR/$BINARCH_native --no-doc-install --no-src-install --no-interaction
echo '<?xml version="1.0"?><!DOCTYPE fontconfig SYSTEM "fonts.dtd"><fontconfig><dir>/texlive/texmf-dist/fonts/opentype</dir><dir>/texlive/texmf-dist/fonts/type1</dir></fontconfig>' > $DIST/fonts.conf
find $DIST -name '*.fmt'
cp $DIST/texmf-dist/texmf-var/web2c/luahbtex/lualatex.fmt $DIST/texmf-dist/texmf-var/web2c/luahbtex/luahblatex.fmt
