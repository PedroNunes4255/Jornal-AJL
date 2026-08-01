"""
=========================================================
GERADOR DE NOTÍCIAS - JORNAL AJL
Versão profissional

Responsável por:
- Ler DOCX preservando estrutura
- Extrair imagens
- Gerar HTML
- Atualizar NEWS_DATA
- Criar backups
- Organizar matérias

Autor:
Jornal AJL
=========================================================
"""

from __future__ import annotations

import os
import re
import json
import shutil
import html
import zipfile
import unicodedata

from pathlib import Path
from datetime import datetime
from typing import List, Dict, Optional


# =========================================================
# CONFIGURAÇÕES
# =========================================================


class Config:

    FRONTEND = Path("frontend")

    PAGES = FRONTEND / "pages"
    IMG = FRONTEND / "IMG"
    JS = FRONTEND / "js"

    NEWS_DATA = JS / "news-data.js"

    BACKUP = FRONTEND / "backup"

    AUTOR_PADRAO = "@jornalajl"

    IMAGEM_PADRAO = "default.jpg"


    CATEGORIAS = {
        "1": "Cultura",
        "2": "Brasil",
        "3": "Escola",
        "4": "Esportes",
        "5": "Mundo"
    }


# =========================================================
# MODELOS INTERNOS
# =========================================================


class ElementoDOCX:

    """
    Representa qualquer elemento encontrado
    dentro do Word.

    Tipos possíveis:

    paragraph
    image
    table
    list
    """

    def __init__(
        self,
        tipo: str,
        conteudo: str = "",
        imagem: Optional[str] = None
    ):

        self.tipo = tipo
        self.conteudo = conteudo
        self.imagem = imagem


class Materia:

    """
    Modelo central de uma notícia.
    """

    def __init__(
        self,
        titulo: str,
        slug: str,
        autor: str,
        categoria: str
    ):

        self.titulo = titulo
        self.slug = slug
        self.autor = autor
        self.categoria = categoria

        self.elementos: List[ElementoDOCX] = []

        self.imagens: List[str] = []

        self.creditos: List[str] = []

        self.excerpt = ""

        self.html = ""


# =========================================================
# UTILIDADES
# =========================================================


class Utils:


    @staticmethod
    def limpar_acentos(texto: str) -> str:

        return "".join(
            c
            for c in unicodedata.normalize(
                "NFD",
                texto
            )
            if unicodedata.category(c) != "Mn"
        )


    @staticmethod
    def slugify(texto: str) -> str:

        texto = texto.lower()

        texto = Utils.limpar_acentos(texto)

        texto = re.sub(
            r"[^a-z0-9\s-]",
            "",
            texto
        )

        texto = re.sub(
            r"[\s-]+",
            "-",
            texto
        )

        return texto.strip("-")



    @staticmethod
    def limpar_texto(texto: str) -> str:

        if not texto:
            return ""


        texto = (
            texto
            .replace("\u00a0", " ")
            .replace("\ufeff", "")
        )


        texto = re.sub(
            r"[ ]{2,}",
            " ",
            texto
        )


        texto = re.sub(
            r"\n{3,}",
            "\n\n",
            texto
        )


        return texto.strip()



    @staticmethod
    def escapar_html(texto: str) -> str:

        return html.escape(
            texto,
            quote=True
        )



    @staticmethod
    def validar_slug(slug: str) -> bool:

        return bool(
            re.match(
                r"^[a-z0-9-]+$",
                slug
            )
        )


# =========================================================
# SISTEMA DE ARQUIVOS
# =========================================================


class FileManager:


    def __init__(self):

        self.criar_pastas()



    def criar_pastas(self):

        for pasta in [
            Config.PAGES,
            Config.IMG,
            Config.JS,
            Config.BACKUP
        ]:

            pasta.mkdir(
                parents=True,
                exist_ok=True
            )



    def existe_html(
        self,
        slug: str
    ) -> bool:

        return (
            Config.PAGES / slug
        ).exists()



    def criar_backup(
        self,
        slug: str
    ) -> Optional[Path]:

        arquivo = Config.PAGES / slug


        if not arquivo.exists():

            return None



        data = datetime.now().strftime(
            "%Y-%m-%d"
        )


        pasta_backup = (
            Config.BACKUP /
            data
        )


        pasta_backup.mkdir(
            parents=True,
            exist_ok=True
        )


        destino = (
            pasta_backup /
            slug
        )


        shutil.copy2(
            arquivo,
            destino
        )


        return destino



    def remover_imagens_antigas(
        self,
        slug_base: str
    ):

        padrao = re.compile(
            rf"^{re.escape(slug_base)}-(capa|\d+)\."
        )


        for arquivo in Config.IMG.iterdir():

            if arquivo.is_file():

                if padrao.match(
                    arquivo.name
                ):

                    arquivo.unlink()



    def salvar_texto(
        self,
        caminho: Path,
        conteudo: str
    ):

        with open(
            caminho,
            "w",
            encoding="utf-8"
        ) as arquivo:

            arquivo.write(
                conteudo
            )



    def ler_texto(
        self,
        caminho: Path
    ) -> str:


        if not caminho.exists():

            return ""


        with open(
            caminho,
            "r",
            encoding="utf-8"
        ) as arquivo:

            return arquivo.read()



# =========================================================
# VALIDAÇÕES
# =========================================================


class Validator:


    @staticmethod
    def titulo(
        titulo: str
    ):

        if not titulo.strip():

            raise ValueError(
                "Título obrigatório."
            )



    @staticmethod
    def docx(
        arquivo: str
    ):

        caminho = Path(arquivo)


        if not caminho.exists():

            raise FileNotFoundError(
                "DOCX não encontrado."
            )


        if caminho.suffix.lower() != ".docx":

            raise ValueError(
                "Arquivo precisa ser DOCX."
            )



    @staticmethod
    def categoria(
        categoria: str
    ):

        if categoria not in Config.CATEGORIAS.values():

            raise ValueError(
                "Categoria inválida."
            )



    @staticmethod
    def slug(
        slug: str
    ):

        if not Utils.validar_slug(slug):

            raise ValueError(
                "Slug inválido."
            )


# =========================================================
# NEWS DATA
# =========================================================


class NewsManager:


    def carregar(self) -> List[Dict]:


        if not Config.NEWS_DATA.exists():

            return []


        conteudo = Config.NEWS_DATA.read_text(
            encoding="utf-8"
        )


        conteudo = (
            conteudo
            .replace(
                "window.NEWS_DATA =",
                ""
            )
            .strip()
            .rstrip(";")
        )


        try:

            return json.loads(
                conteudo
            )

        except json.JSONDecodeError:

            return []



    def salvar(
        self,
        noticias: List[Dict]
    ):


        json_data = json.dumps(
            noticias,
            ensure_ascii=False,
            indent=2
        )


        conteudo = (
            "window.NEWS_DATA = "
            + json_data
            + ";"
        )


        Config.NEWS_DATA.write_text(
            conteudo,
            encoding="utf-8"
        )



    def atualizar(
        self,
        noticia: Dict
    ):


        noticias = self.carregar()


        encontrado = False


        for index, item in enumerate(noticias):

            if item.get("slug") == noticia["slug"]:

                noticias[index] = noticia

                encontrado = True

                break



        if not encontrado:

            noticias.append(
                noticia
            )


        self.salvar(
            noticias
        )

# =========================================================
# PARSER DOCX XML
# =========================================================


class DOCXParser:


    """
    Parser avançado de arquivos DOCX.

    O DOCX é um arquivo ZIP contendo XML.
    Aqui lemos diretamente o documento interno
    para preservar a ordem real dos elementos.
    """



    NS = {

        "w":
        "http://schemas.openxmlformats.org/wordprocessingml/2006/main",

        "a":
        "http://schemas.openxmlformats.org/drawingml/2006/main",

        "r":
        "http://schemas.openxmlformats.org/officeDocument/2006/relationships",

        "pic":
        "http://schemas.openxmlformats.org/drawingml/2006/picture"

    }



    def __init__(self):

        self.imagens_extraidas = []



    # -----------------------------------------------------
    # ABRIR XML DO DOCX
    # -----------------------------------------------------


    def carregar_xml(
        self,
        caminho: str
    ):


        import xml.etree.ElementTree as ET


        with zipfile.ZipFile(
            caminho
        ) as arquivo:


            xml = arquivo.read(
                "word/document.xml"
            )


        return ET.fromstring(
            xml
        )



    # -----------------------------------------------------
    # RELAÇÃO DAS IMAGENS
    # -----------------------------------------------------


    def carregar_relacoes(
        self,
        caminho: str
    ):


        import xml.etree.ElementTree as ET


        with zipfile.ZipFile(
            caminho
        ) as arquivo:


            try:

                xml = arquivo.read(
                    "word/_rels/document.xml.rels"
                )

            except KeyError:

                return {}



        root = ET.fromstring(
            xml
        )


        relacoes = {}


        for rel in root:

            relacoes[
                rel.attrib["Id"]
            ] = rel.attrib["Target"]


        return relacoes



    # -----------------------------------------------------
    # EXTRAIR TODAS IMAGENS
    # -----------------------------------------------------


    def extrair_imagens(
        self,
        caminho_docx: str,
        slug: str
    ) -> Dict[str, str]:


        imagens = {}



        with zipfile.ZipFile(
            caminho_docx
        ) as arquivo:


            arquivos = arquivo.namelist()


            contador = 0



            for item in arquivos:


                if item.startswith(
                    "word/media/"
                ):


                    contador += 1


                    extensao = Path(
                        item
                    ).suffix


                    if contador == 1:

                        nome = (
                            f"{slug}-capa"
                            f"{extensao}"
                        )


                    else:

                        nome = (
                            f"{slug}-{contador-1:02d}"
                            f"{extensao}"
                        )



                    destino = (
                        Config.IMG /
                        nome
                    )



                    with arquivo.open(
                        item
                    ) as origem:


                        destino.write_bytes(
                            origem.read()
                        )



                    imagens[
                        item
                    ] = nome



                    self.imagens_extraidas.append(
                        nome
                    )



        return imagens



    # -----------------------------------------------------
    # BUSCAR TEXTO
    # -----------------------------------------------------


    def extrair_texto(
        self,
        elemento
    ):


        textos = []



        for node in elemento.iter():

            if node.tag.endswith(
                "}t"
            ):

                if node.text:

                    textos.append(
                        node.text
                    )



        return "".join(
            textos
        ).strip()



    # -----------------------------------------------------
    # IDENTIFICAR LISTAS
    # -----------------------------------------------------


    def eh_lista(
        self,
        elemento
    ):


        for node in elemento.iter():


            if node.tag.endswith(
                "}numPr"
            ):

                return True


        return False



    # -----------------------------------------------------
    # IDENTIFICAR IMAGEM
    # -----------------------------------------------------


    def encontrar_imagem(
        self,
        elemento,
        relacoes,
        imagens
    ):


        for node in elemento.iter():


            if node.tag.endswith(
                "}blip"
            ):


                rel_id = node.attrib.get(
                    "{http://schemas.openxmlformats.org/officeDocument/2006/relationships}embed"
                )


                if rel_id in relacoes:


                    caminho = (
                        "word/"
                        +
                        relacoes[rel_id]
                    )


                    return imagens.get(
                        caminho
                    )



        return None



    # -----------------------------------------------------
    # PROCESSAR DOCUMENTO
    # -----------------------------------------------------


    def processar(
        self,
        caminho_docx: str,
        slug: str
    ) -> List[ElementoDOCX]:


        raiz = self.carregar_xml(
            caminho_docx
        )


        relacoes = self.carregar_relacoes(
            caminho_docx
        )


        imagens = self.extrair_imagens(
            caminho_docx,
            slug
        )


        elementos = []



        corpo = None



        for item in raiz.iter():

            if item.tag.endswith(
                "}body"
            ):

                corpo = item

                break



        if corpo is None:

            return elementos



        for filho in corpo:


            # -----------------------------------------
            # PARÁGRAFO
            # -----------------------------------------


            if filho.tag.endswith(
                "}p"
            ):


                texto = self.extrair_texto(
                    filho
                )


                imagem = self.encontrar_imagem(
                    filho,
                    relacoes,
                    imagens
                )



                if imagem:


                    elementos.append(
                        ElementoDOCX(
                            "image",
                            imagem=imagem
                        )
                    )



                if texto:


                    tipo = (
                        "list"
                        if self.eh_lista(filho)
                        else "paragraph"
                    )


                    elementos.append(
                        ElementoDOCX(
                            tipo,
                            texto
                        )
                    )




            # -----------------------------------------
            # TABELAS
            # -----------------------------------------


            elif filho.tag.endswith(
                "}tbl"
            ):


                texto = self.extrair_texto(
                    filho
                )


                if texto:

                    elementos.append(
                        ElementoDOCX(
                            "table",
                            texto
                        )
                    )



        return elementos



# =========================================================
# DETECTOR DE CRÉDITOS
# =========================================================


class CreditDetector:



    PADROES = [

        "📸",
        "foto:",
        "fotos:",
        "imagem:",
        "imagens:",
        "crédito:",
        "credito:",
        "créditos:",
        "creditos:",
        "fonte:",
        "reprodução:",
        "reproducao:"

    ]



    FONTES = [

        "g1",
        "globo",
        "cnn",
        "uol",
        "reuters",
        "bbc",
        "getty",
        "ap photo"

    ]



    @classmethod
    def detectar(
        cls,
        texto: str
    ):


        linhas = texto.splitlines()


        limpas = []

        creditos = []



        for linha in linhas:


            linha_strip = linha.strip()


            lower = linha_strip.lower()



            encontrado = False



            for padrao in cls.PADROES:


                if lower.startswith(
                    padrao
                ):

                    creditos.append(
                        linha_strip
                    )

                    encontrado = True

                    break



            if not encontrado:


                if lower in cls.FONTES:

                    creditos.append(
                        linha_strip
                    )

                    encontrado = True



            if not encontrado:

                limpas.append(
                    linha
                )



        return (
            "\n".join(limpas),
            creditos
        )

# =========================================================
# PROCESSADOR DE CONTEÚDO
# =========================================================


class ContentProcessor:


    """
    Responsável por transformar os elementos
    extraídos do DOCX em HTML limpo.
    """



    def __init__(self):

        self.contadores = {

            "paragrafos": 0,
            "imagens": 0,
            "galerias": 0,
            "listas": 0,
            "subtitulos": 0,
            "legendas": 0

        }



    # -----------------------------------------------------
    # LINKS
    # -----------------------------------------------------


    def transformar_links(
        self,
        texto: str
    ) -> str:


        texto = Utils.escapar_html(
            texto
        )



        # URLs


        texto = re.sub(

            r"(https?://[^\s]+)",

            r'<a href="\1" target="_blank">\1</a>',

            texto

        )



        # Instagram @usuario


        texto = re.sub(

            r"(?<!\w)@([a-zA-Z0-9._]+)",

            r'<a href="https://instagram.com/\1" target="_blank">@\1</a>',

            texto

        )



        return texto



    # -----------------------------------------------------
    # SUBTÍTULOS
    # -----------------------------------------------------


    def identificar_subtitulo(
        self,
        texto: str
    ) -> Optional[str]:


        texto = texto.strip()



        if not texto:

            return None



        tamanho = len(texto)



        if tamanho > 80:

            return None



        sinais = [

            "?",

            ":"

        ]



        if any(
            s in texto
            for s in sinais
        ):

            return "h2"



        palavras = texto.split()



        if len(palavras) <= 6:

            return "h3"



        return None



    # -----------------------------------------------------
    # LISTAS
    # -----------------------------------------------------


    def criar_lista(
        self,
        itens: List[str]
    ) -> str:


        self.contadores["listas"] += 1



        html = "<ul>\n"



        for item in itens:


            html += (

                "<li>"
                +
                self.transformar_links(item)
                +
                "</li>\n"

            )



        html += "</ul>\n"



        return html



    # -----------------------------------------------------
    # GALERIA
    # -----------------------------------------------------


    def criar_galeria(
        self,
        imagens: List[str]
    ) -> str:


        if len(imagens) < 2:

            return ""



        self.contadores["galerias"] += 1



        html = (

            '<div class="gallery">\n'

        )



        for imagem in imagens:


            html += f"""

<img
src="../IMG/{imagem}"
alt="Imagem da matéria"
>

"""



        html += "</div>\n"



        return html



    # -----------------------------------------------------
    # IMAGEM INDIVIDUAL
    # -----------------------------------------------------


    def criar_imagem(
        self,
        imagem: str,
        legenda: Optional[str] = None
    ) -> str:


        self.contadores["imagens"] += 1



        html = f"""

<figure class="media">

<img
src="../IMG/{imagem}"
alt="Imagem da matéria"
>

"""



        if legenda:


            self.contadores["legendas"] += 1


            html += f"""

<figcaption>
{Utils.escapar_html(legenda)}
</figcaption>

"""



        html += """

</figure>

"""


        return html



    # -----------------------------------------------------
    # CONVERTER ELEMENTOS
    # -----------------------------------------------------


    def gerar_html(
        self,
        elementos: List[ElementoDOCX]
    ) -> str:


        resultado = []


        lista_atual = []



        imagens_seguidas = []



        for elemento in elementos:



            # =========================================
            # IMAGEM
            # =========================================


            if elemento.tipo == "image":


                imagens_seguidas.append(
                    elemento.imagem
                )


                continue




            # =========================================
            # TEXTO NORMAL
            # =========================================


            if imagens_seguidas:



                if len(imagens_seguidas) >= 2:


                    resultado.append(

                        self.criar_galeria(
                            imagens_seguidas
                        )

                    )


                else:


                    resultado.append(

                        self.criar_imagem(
                            imagens_seguidas[0]
                        )

                    )


                imagens_seguidas = []





            texto = Utils.limpar_texto(
                elemento.conteudo
            )



            if not texto:

                continue





            # =========================================
            # LISTAS
            # =========================================


            if elemento.tipo == "list":


                lista_atual.append(
                    texto
                )


                continue



            else:


                if lista_atual:


                    resultado.append(

                        self.criar_lista(
                            lista_atual
                        )

                    )


                    lista_atual = []






            # =========================================
            # SUBTÍTULOS
            # =========================================


            subtitulo = self.identificar_subtitulo(
                texto
            )



            if subtitulo:



                self.contadores["subtitulos"] += 1



                resultado.append(

                    f"<{subtitulo}>"
                    +
                    self.transformar_links(texto)
                    +
                    f"</{subtitulo}>"

                )



                continue





            # =========================================
            # PARÁGRAFO
            # =========================================


            self.contadores["paragrafos"] += 1



            resultado.append(

                "<p>"
                +
                self.transformar_links(texto)
                +
                "</p>"

            )





        # fecha imagens finais


        if imagens_seguidas:


            if len(imagens_seguidas) >= 2:


                resultado.append(

                    self.criar_galeria(
                        imagens_seguidas
                    )

                )

            else:


                resultado.append(

                    self.criar_imagem(
                        imagens_seguidas[0]
                    )

                )



        if lista_atual:


            resultado.append(

                self.criar_lista(
                    lista_atual
                )

            )



        return "\n".join(
            resultado
        )



# =========================================================
# GERADOR DE EXCERPT
# =========================================================


class ExcerptGenerator:



    IGNORAR = [

        "foto:",
        "imagem:",
        "crédito:",
        "credito:",
        "fonte:",
        "reprodução:",
        "reproducao:",
        "📸"

    ]



    def gerar(
        self,
        elementos: List[ElementoDOCX],
        limite=260
    ):


        textos = []



        for elemento in elementos:


            if elemento.tipo != "paragraph":

                continue



            texto = elemento.conteudo.strip()



            if not texto:

                continue



            lower = texto.lower()



            if any(
                lixo in lower
                for lixo in self.IGNORAR
            ):

                continue



            textos.append(
                texto
            )



        resumo = " ".join(
            textos
        )



        resumo = Utils.limpar_texto(
            resumo
        )



        if len(resumo) <= limite:

            return resumo



        return (
            resumo[:limite]
            .rsplit(" ",1)[0]
            +
            "..."
        )


# =========================================================
# GERADOR HTML FINAL
# =========================================================


class HTMLGenerator:


    """
    Cria o arquivo final da matéria.

    Mantém compatibilidade com:
    frontend/pages
    frontend/CSS
    frontend/js
    """



    def gerar(
        self,
        materia: Materia,
        conteudo_html: str,
        imagem_capa: str,
        relacionadas: List[Dict]
    ):


        data = datetime.now().strftime(
            "%d/%m/%Y"
        )



        relacionados_html = ""



        for noticia in relacionadas[-6:]:


            relacionados_html += f"""

<li>
<a href="./{noticia["slug"]}">
{Utils.escapar_html(noticia["title"])}
</a>
</li>

"""



        html_final = f"""
<!doctype html>

<html lang="pt-BR">


<head>


<meta charset="utf-8">


<meta name="viewport"
content="width=device-width, initial-scale=1">


<meta name="last-updated"
content="{datetime.now().strftime("%Y-%m-%d")}">


<title>
{Utils.escapar_html(materia.titulo)}
- Jornal AJL
</title>


<link rel="stylesheet"
href="../CSS/style.css">


</head>



<body>


<div id="siteHeader"></div>


<main class="container">


<div class="article-wrap">



<article class="article">


<div class="pad">



<div class="breadcrumb">


<a href="../index.html">
Início
</a>


•


<a href="./todas-noticias.html">
{materia.categoria}
</a>



</div>




<h1>
{Utils.escapar_html(materia.titulo)}
</h1>




<div class="byline">


<span>

Por

<strong>

<a href="https://instagram.com/{materia.autor.replace("@","")}"
target="_blank">

{materia.autor}

</a>

</strong>

</span>


<span>
•
</span>


<span>

Atualizado em {data}

</span>



</div>


</div>





<figure class="media">

<img

src="../IMG/{imagem_capa}"

alt="{Utils.escapar_html(materia.titulo)}"

>

</figure>





<div class="pad body">


{conteudo_html}



<div class="note">


Este é um conteúdo escolar,
produzido por alunos.


</div>


</div>



</article>





<aside class="widget">



<header>


<h3>
Leia também
</h3>



<a href="./todas-noticias.html"
class="small">

Ver todas

</a>



</header>




<div class="pad">


<ul class="small">


{relacionados_html}


</ul>


</div>



</aside>



</div>


</main>



<div id="siteFooter"></div>



<script src="../js/site.js"></script>


</body>


</html>

"""



        destino = (
            Config.PAGES /
            materia.slug
        )


        destino.write_text(
            html_final,
            encoding="utf-8"
        )



        return destino



# =========================================================
# CONTROLE PRINCIPAL
# =========================================================


class GeradorNoticias:


    def __init__(self):

        self.files = FileManager()

        self.news = NewsManager()

        self.parser = DOCXParser()

        self.processor = ContentProcessor()

        self.excerpt = ExcerptGenerator()

        self.html = HTMLGenerator()



    # -----------------------------------------------------
    # PERGUNTAS
    # -----------------------------------------------------


    def coletar_dados(self):


        titulo = input(
            "\nTítulo da matéria: "
        ).strip()



        Validator.titulo(
            titulo
        )



        slug_base = Utils.slugify(
            titulo
        )


        slug = slug_base + ".html"



        Validator.slug(
            slug_base
        )



        autor = input(
            "Instagram do autor: "
        ).strip()



        if not autor:

            autor = Config.AUTOR_PADRAO


        else:

            autor = (
                "@"
                +
                autor.replace("@","")
            )





        print("\nCategorias:")


        for chave, valor in Config.CATEGORIAS.items():

            print(
                f"{chave} - {valor}"
            )



        categoria_num = input(
            "Escolha: "
        ).strip()



        categoria = Config.CATEGORIAS.get(
            categoria_num
        )



        if not categoria:

            raise ValueError(
                "Categoria inválida."
            )



        caminho = input(
            "\nArquivo DOCX: "
        ).replace(
            '"',
            ''
        ).strip()



        Validator.docx(
            caminho
        )



        return (
            titulo,
            slug,
            slug_base,
            autor,
            categoria,
            caminho
        )




    # -----------------------------------------------------
    # EXECUÇÃO
    # -----------------------------------------------------


    def executar(self):


        (
            titulo,
            slug,
            slug_base,
            autor,
            categoria,
            docx

        ) = self.coletar_dados()



        caminho_html = (
            Config.PAGES /
            slug
        )



        if caminho_html.exists():


            print(
                "\n⚠️ Essa matéria já existe."
            )


            print(
                "[1] Atualizar"
            )

            print(
                "[2] Cancelar"
            )


            opcao = input(
                "Escolha: "
            )



            if opcao != "1":

                print(
                    "Cancelado."
                )

                return



            backup = self.files.criar_backup(
                slug
            )


            if backup:

                print(
                    "✔ Backup criado:",
                    backup
                )



            self.files.remover_imagens_antigas(
                slug_base
            )





        materia = Materia(
            titulo,
            slug,
            autor,
            categoria
        )



        elementos = self.parser.processar(
            docx,
            slug_base
        )



        materia.elementos = elementos



        conteudo_html = (
            self.processor.gerar_html(
                elementos
            )
        )

        # adiciona imagens extras no corpo da matéria

        imagens_extras = self.parser.imagens_extraidas[1:]


        if imagens_extras:

            galeria = self.processor.criar_galeria(
                imagens_extras
            )

            conteudo_html += galeri


        materia.excerpt = (
            self.excerpt.gerar(
                elementos
            )
        )



        imagens = (
            self.parser.imagens_extraidas
        )



        if imagens:

            capa = imagens[0]


        else:

            capa = Config.IMAGEM_PADRAO





        noticias = (
            self.news.carregar()
        )



        relacionadas = noticias.copy()



        nova = {

            "title":
            titulo,


            "slug":
            slug,


            "image":
            capa,


            "excerpt":
            materia.excerpt,


            "author":
            autor,


            "category":
            categoria

        }




        self.news.atualizar(
            nova
        )




        arquivo = self.html.gerar(
            materia,
            conteudo_html,
            capa,
            relacionadas
        )



        print("\n==============================")

        print("RELATÓRIO FINAL")

        print("==============================")



        print(
            "✔ HTML criado:",
            arquivo.name
        )


        print(
            "✔ News-data atualizado"
        )



        print(
            "✔",
            self.processor.contadores["paragrafos"],
            "parágrafos"
        )


        print(
            "✔",
            self.processor.contadores["imagens"],
            "imagens"
        )


        print(
            "✔",
            self.processor.contadores["galerias"],
            "galeria(s)"
        )


        print(
            "✔",
            self.processor.contadores["listas"],
            "lista(s)"
        )


        print(
            "✔",
            self.processor.contadores["subtitulos"],
            "subtítulo(s)"
        )


        print(
            "✔ Processo concluído."
        )




# =========================================================
# START
# =========================================================


if __name__ == "__main__":


    try:

        app = GeradorNoticias()

        app.executar()



    except Exception as erro:


        print(
            "\n❌ Erro:"
        )

        print(
            erro
        )
