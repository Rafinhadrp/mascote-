#!/usr/bin/env python3
"""Gera o mascote pixel-art do <R/> (PNG, GIF e SVG animados).

Tudo é desenhado aqui, pixel por pixel, então dá pra mudar cor, pose ou
animação e gerar de novo:

    python3 desenho/gerar_mascote.py

Precisa do Pillow (pip install pillow).
"""
import os

from PIL import Image

PASTA = os.path.dirname(os.path.abspath(__file__))

# Paleta tirada da logo <R/>
K = (13, 17, 23)       # fundo / contorno / olhos
W = (230, 237, 243)    # corpo (o "R")
S = (184, 196, 209)    # sombra do corpo
B = (88, 166, 255)     # azul dos sinais < / >
BD = (31, 111, 235)    # azul escuro
G1 = (48, 54, 61)      # notebook / monitor
G2 = (72, 79, 88)      # bordas e teclas
G3 = (22, 27, 34)      # fundo da tela
GR = (63, 185, 80)     # código verde
PU = (210, 168, 255)   # código roxo
RD = (248, 81, 73)     # erro
GL = (196, 222, 255)   # brilho da tela refletido no rosto


class Tela:
    def __init__(self, w=32, h=32):
        self.w, self.h = w, h
        self.px = {}

    def p(self, x, y, c):
        if 0 <= x < self.w and 0 <= y < self.h:
            self.px[(x, y)] = c

    def ret(self, x, y, w, h, c):
        for yy in range(y, y + h):
            for xx in range(x, x + w):
                self.p(xx, yy, c)

    def pts(self, ox, oy, celulas, c):
        for x, y in celulas:
            self.p(ox + x, oy + y, c)

    def contorno(self):
        """Contorno escuro de 1px em volta de tudo (some no fundo escuro, aparece no claro)."""
        novos = set()
        for x, y in self.px:
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                n = (x + dx, y + dy)
                if n not in self.px and 0 <= n[0] < self.w and 0 <= n[1] < self.h:
                    novos.add(n)
        for n in novos:
            self.px[n] = K
        return self


# ---------------------------------------------------------------- formas

MAO_E = [(2, 0), (3, 0), (1, 1), (2, 1), (0, 2), (1, 2), (1, 3), (2, 3), (2, 4), (3, 4)]  # "<"
MAO_D = [(3 - x, y) for x, y in MAO_E]  # ">"
MAO_C = [(y, x) for x, y in MAO_E]      # "^"
MAOS = {'<': MAO_E, '>': MAO_D, '^': MAO_C}

# a "/" da logo vira a antena
ANTENA = [(6, -1), (7, -1), (6, -2), (7, -2), (7, -3), (8, -3), (7, -4), (8, -4)]
PONTA = [(8, -5), (9, -5)]

OLHOS = {
    'aberto': [(3, 3), (3, 4), (8, 3), (8, 4)],
    'esq': [(2, 3), (2, 4), (7, 3), (7, 4)],
    'dir': [(4, 3), (4, 4), (9, 3), (9, 4)],
    'baixo': [(3, 4), (3, 5), (8, 4), (8, 5)],
    'cima_dir': [(4, 2), (4, 3), (9, 2), (9, 3)],
    'fechado': [(2, 4), (3, 4), (8, 4), (9, 4)],
    'feliz': [(2, 4), (3, 3), (4, 4), (7, 4), (8, 3), (9, 4)],
    'x': [(2, 3), (4, 3), (3, 4), (2, 5), (4, 5), (7, 3), (9, 3), (8, 4), (7, 5), (9, 5)],
    'rindo': [(2, 3), (3, 4), (2, 5), (9, 3), (8, 4), (9, 5)],               # > <
    'ponto': [(3, 4), (8, 4)],                                               # assustado
    'piscada': [(2, 4), (3, 4), (8, 3), (8, 4)],
    'malvado': [(3, 4), (4, 4), (8, 4), (9, 4)],                             # olhar de lado, meio fechado
}

SOBRANCELHAS = {
    'brava': [(2, 2), (3, 2), (4, 3), (7, 3), (8, 2), (9, 2)],
    'triste': [(2, 3), (3, 2), (4, 2), (7, 2), (8, 2), (9, 3)],
}

BOCAS = {
    'sorriso': [(4, 6), (5, 7), (6, 7), (7, 6)],
    'aberta': [(5, 6), (6, 6), (4, 7), (5, 7), (6, 7), (7, 7)],
    'o': [(5, 6), (6, 6), (5, 7), (6, 7)],
    'reta': [(5, 7), (6, 7)],
    'risada': [(3, 6), (4, 6), (5, 6), (6, 6), (7, 6), (8, 6), (4, 7), (7, 7)],
    'malvado': [(3, 5), (4, 6), (5, 6), (6, 6), (7, 6), (8, 5)],
    'bico': [(4, 7), (5, 6), (6, 6), (7, 7)],
    'lingua': [(4, 6), (5, 6), (6, 6), (7, 6)],
    'bocejo': [(5, 5), (6, 5), (4, 6), (5, 6), (6, 6), (7, 6), (5, 7), (6, 7)],
}

# pedaços de boca coloridos (língua)
LINGUA = {'risada': [(5, 7), (6, 7)], 'lingua': [(6, 7), (7, 7)]}

# glifos pequenos (efeitos)
G_0 = [(0, 0), (1, 0), (2, 0), (0, 1), (2, 1), (0, 2), (1, 2), (2, 2)]
G_1 = [(0, 0), (1, 0), (1, 1), (0, 2), (1, 2), (2, 2)]
BRILHO = [(1, 0), (0, 1), (1, 1), (2, 1), (1, 2)]
Z3 = [(0, 0), (1, 0), (2, 0), (1, 1), (0, 2), (1, 2), (2, 2)]
Z4 = [(0, 0), (1, 0), (2, 0), (3, 0), (2, 1), (1, 2), (0, 3), (1, 3), (2, 3), (3, 3)]
EXCLAMACAO = [(0, 0), (1, 0), (0, 1), (1, 1), (0, 2), (1, 2), (0, 3), (1, 3), (0, 5), (1, 5)]
LOGO = [(1, 0), (0, 1), (1, 2), (5, 0), (4, 1), (3, 2), (7, 0), (8, 1), (7, 2)]  # </>


def mascote(t, ox, oy, olhos='aberto', boca=None, bob=0, mao_e=(0, 0), mao_d=(0, 0),
            forma_e='<', forma_d='>', pernas='pe', ponta=W, bochecha=False, brilho=False, sobrancelha=None):
    """Desenha o mascote com o corpo em (ox, oy). O corpo tem 12x9 px."""
    y = oy + bob
    if pernas:
        topo = y + 9
        altura = 1 if pernas == 'pulo' else max(1, oy + 11 - topo)
        for lx in (2, 8):
            t.ret(ox + lx, topo, 2, altura, W)

    t.ret(ox, y, 12, 9, W)
    t.ret(ox + 1, y + 8, 11, 1, S)
    t.ret(ox + 11, y + 1, 1, 8, S)
    for cx in (0, 11):
        t.px.pop((ox + cx, y), None)
    if brilho:
        t.ret(ox + 1, y + 6, 10, 1, GL)

    t.pts(ox, y, ANTENA, B)
    t.pts(ox, y, PONTA, ponta)
    t.pts(ox, y, OLHOS[olhos], K)
    if boca:
        t.pts(ox, y, BOCAS[boca], K)
        t.pts(ox, y, LINGUA.get(boca, []), RD)
    if sobrancelha:
        t.pts(ox, y, SOBRANCELHAS[sobrancelha], K)
    if bochecha:
        t.pts(ox, y, [(1, 5), (10, 5)], B)

    t.pts(ox - 5 + mao_e[0], y + 3 + mao_e[1], MAOS[forma_e], B)
    t.pts(ox + 13 + mao_d[0], y + 3 + mao_d[1], MAOS[forma_d], B)


# ---------------------------------------------------------------- animações
# Cada função devolve [(Tela, duração_ms), ...]

def parado():
    seq = [
        (0, 'aberto', 350), (1, 'aberto', 350), (0, 'aberto', 350), (1, 'aberto', 250),
        (1, 'fechado', 100), (1, 'aberto', 200), (0, 'esq', 350), (1, 'esq', 350),
        (0, 'dir', 350), (1, 'dir', 350), (0, 'aberto', 350), (1, 'aberto', 350),
    ]
    quadros, anterior = [], seq[-1][0]
    for i, (bob, olhos, ms) in enumerate(seq):
        t = Tela()
        atraso = (0, anterior - bob)  # as mãos flutuam um quadro atrás do corpo
        mascote(t, 10, 13, olhos=olhos, bob=bob, mao_e=atraso, mao_d=atraso,
                ponta=W if i % 4 < 2 else B)
        quadros.append((t.contorno(), ms))
        anterior = bob
    return quadros


def digitando():
    """Atrás do notebook, digitando, com 0 e 1 subindo."""
    sobe_e = {1, 3, 6, 9, 11, 14}
    sobe_d = {0, 2, 5, 7, 8, 10, 13, 15}
    particulas = [(0, 1, G_1, B), (4, 27, G_0, GR), (8, 2, G_0, B), (12, 28, G_1, GR)]
    quadros = []
    for f in range(16):
        t = Tela()
        ox, oy = 10, 11
        for ini, x, glifo, cor in particulas:
            idade = (f - ini) % 16
            if idade < 8:
                t.pts(x, 13 - idade, glifo, cor)
        mascote(t, ox, oy, olhos='fechado' if f == 11 else 'baixo', pernas=None,
                mao_e=(0, 4 if f in sobe_e else 5), mao_d=(0, 4 if f in sobe_d else 5),
                ponta=W if f % 4 < 2 else B, brilho=True)
        # tampa do notebook (vista de trás) + base
        t.ret(ox - 2, oy + 7, 16, 6, G1)
        t.ret(ox - 2, oy + 7, 16, 1, G2)
        t.pts(ox + 1, oy + 9, LOGO, B if f % 8 < 4 else BD)
        t.ret(ox - 4, oy + 13, 20, 1, G2)
        quadros.append((t.contorno(), 90))
    return quadros


CODIGO = [
    [(PU, 5), (None, 1), (B, 3), (None, 1), (W, 1)],
    [(None, 2), (B, 6), (W, 1), (GR, 7)],
    [(None, 2), (PU, 2), (None, 1), (W, 4)],
    [(None, 4), (GR, 9)],
    [(None, 2), (W, 3)],
    [(B, 2), (W, 1)],
]


def programando():
    """De lado pro monitor, escrevendo código que aparece na tela."""
    tamanhos = [sum(n for _, n in linha) for linha in CODIGO]
    total = sum(tamanhos)
    passos = list(range(0, total + 1, 2))
    if passos[-1] != total:
        passos.append(total)
    roteiro = [('digita', n) for n in passos] + [('pronto', total)] * 10 + [('limpa', 0)] * 2

    quadros = []
    for f, (fase, escritos) in enumerate(roteiro):
        t = Tela(48, 32)
        ox, oy = 5, 12
        digitando_agora = fase == 'digita'
        mascote(t, ox, oy,
                olhos='dir' if fase != 'pronto' else 'feliz',
                boca='sorriso' if fase == 'pronto' else None,
                bochecha=fase == 'pronto',
                bob=1 if fase == 'pronto' and f % 4 < 2 else 0,
                mao_e=(0, 1 if (f // 3) % 2 else 0),
                mao_d=(2, 2 if digitando_agora and f % 2 else 3),
                ponta=W if f % 4 < 2 else B)
        # monitor
        t.ret(25, 5, 22, 16, G2)
        t.ret(26, 6, 20, 14, G3)
        t.ret(34, 21, 4, 2, G1)
        t.ret(31, 23, 10, 1, G2)
        # teclado
        t.ret(19, 23, 11, 2, G1)
        for kx in range(20, 29, 2):
            t.p(kx, 23, G2)
        # código
        restante = escritos
        cursor = (28, 8)
        for i, linha in enumerate(CODIGO):
            ly, x = 8 + i * 2, 28
            for cor, n in linha:
                for _ in range(n):
                    if restante <= 0:
                        break
                    if cor:
                        t.p(x, ly, cor)
                    x += 1
                    restante -= 1
            if escritos and restante >= 0 and x > 28:
                cursor = (x, ly)
        if fase == 'digita' or (fase == 'pronto' and f % 4 < 2):
            t.p(cursor[0], cursor[1], W)
        quadros.append((t.contorno(), 70 if fase == 'digita' else 120))
    return quadros


def feliz():
    """Pulinho de comemoração."""
    pulo = [0, 1, -3, -5, -6, -6, -5, -3, 0, 1, 0, 0]
    quadros = []
    for f, dy in enumerate(pulo):
        t = Tela()
        no_ar = dy < 0
        if no_ar:
            for i, (x, y) in enumerate([(3, 6), (27, 8), (5, 24), (26, 25)]):
                if (f + i) % 2:
                    t.pts(x, y, BRILHO, W if i % 2 else B)
        mascote(t, 10, 13, olhos='feliz', boca='sorriso', bochecha=True, bob=dy,
                pernas='pulo' if no_ar or dy > 0 else 'pe',
                mao_e=(-1, -3) if no_ar else (0, 0), mao_d=(1, -3) if no_ar else (0, 0),
                ponta=B if no_ar else W)
        quadros.append((t.contorno(), 80))
    quadros[-1] = (quadros[-1][0], 400)
    return quadros


def acenando():
    posicoes = [(0, -5), (1, -6), (2, -5), (1, -6)]
    quadros = []
    for f in range(12):
        t = Tela()
        dx, dy = posicoes[f % 4]
        bob = 1 if f % 6 >= 3 else 0
        mascote(t, 10, 13, olhos='feliz', boca='sorriso', bochecha=True, bob=bob,
                mao_d=(dx, dy - bob), ponta=W if f % 4 < 2 else B)
        if dx == 2:
            t.ret(29, 9, 1, 2, B)
            t.ret(29, 13, 1, 2, B)
        quadros.append((t.contorno(), 110))
    return quadros


def pensando():
    pontos = [(21, 7), (24, 5), (27, 3)]
    quadros = []
    for f in range(8):
        t = Tela()
        visiveis = min(f // 2, 3) if f < 7 else 3
        for i in range(visiveis):
            t.ret(pontos[i][0], pontos[i][1], 2, 2, W)
        bob = 1 if f % 4 >= 2 else 0
        mascote(t, 10, 13, olhos='fechado' if f == 5 else 'cima_dir', boca='reta', bob=bob,
                mao_e=(2, 2), ponta=B if f % 2 else W)
        quadros.append((t.contorno(), 300))
    return quadros


def dormindo():
    quadros = []
    for f in range(12):
        t = Tela()
        for ini in (0, 6):
            idade = (f - ini) % 12
            if idade < 6:
                x, y = 22 + idade, 9 - idade
                t.pts(x, y, Z3 if idade < 3 else Z4, B if idade < 3 else W)
        bob = 1 if f % 6 >= 3 else 0
        mascote(t, 10, 13, olhos='fechado', boca='o' if bob else 'reta', bob=bob,
                mao_e=(0, 1), mao_d=(0, 1), ponta=BD)
        quadros.append((t.contorno(), 260))
    return quadros


def erro():
    tremida = [0, -1, 1, -1, 1, -1, 0, 0, 0, 0, 0, 0]
    quadros = []
    for f, dx in enumerate(tremida):
        t = Tela()
        if f % 2 == 0 or f >= 6:
            t.pts(26, 2, EXCLAMACAO, RD)
        panico = -2 if f % 2 else -1
        mascote(t, 10 + dx, 13, olhos='x', boca='aberta', mao_e=(-1, panico), mao_d=(1, panico),
                ponta=RD if f % 2 == 0 else W)
        quadros.append((t.contorno(), 90 if f < 6 else 160))
    return quadros


def _pernas_andando(t, ox, y, passo):
    """Pernas do andar: uma no chão um pouco à frente, a outra levantada."""
    base = y + 9
    if passo == 0:
        t.ret(ox + 3, base, 2, 2, W)
        t.ret(ox + 7, base, 2, 1, W)
    elif passo == 2:
        t.ret(ox + 1, base, 2, 1, W)
        t.ret(ox + 9, base, 2, 2, W)
    else:
        for lx in (2, 8):
            t.ret(ox + lx, base, 2, 1, W)


def andando():
    """Andando de lado (olhando pra direita; no pet ele é espelhado pra ir pra esquerda)."""
    quadros = []
    for f in range(4):
        t = Tela()
        bob = f % 2
        balanco = (0, -1) if f in (0, 1) else (0, 1)
        _pernas_andando(t, 10, 13 + bob, f)
        mascote(t, 10, 13, olhos='dir', bob=bob, pernas=None,
                mao_e=balanco, mao_d=(balanco[0], -balanco[1]), ponta=W if f < 2 else B)
        quadros.append((t.contorno(), 140))
    return quadros


def carregando():
    """Correndo gargalhando com as mãos pra cima (no pet ele leva o mouse na mão direita)."""
    quadros = []
    for f in range(4):
        t = Tela()
        bob = f % 2
        for i, ly in enumerate((15, 18, 21)):
            if (f + i) % 2 == 0:
                t.ret(1 + (f + i) % 3, ly, 4, 1, S)
        _pernas_andando(t, 10, 13 + bob, f)
        mascote(t, 10, 13, olhos='rindo', boca='risada', bochecha=True, bob=bob, pernas=None,
                mao_e=(-1, -4 + bob), mao_d=(1, -5), ponta=B if f % 2 else W)
        quadros.append((t.contorno(), 70))
    return quadros


def rindo():
    """Gargalhada: HEHEHE (tremendo, segurando a barriga, lagriminha voando)."""
    quadros = []
    for f in range(8):
        t = Tela()
        bob = f % 2
        dx = (0, 1, 0, -1)[f % 4]
        if f % 4 < 2:
            t.pts(7 + dx - f % 2, 15, [(0, 0), (0, 1)], B)
            t.pts(24 + dx + f % 2, 15, [(0, 0), (0, 1)], B)
        mascote(t, 10 + dx, 13, olhos='rindo', boca='risada', bochecha=True, bob=bob,
                mao_e=(2, 3 - bob), mao_d=(-2, 3 - bob), ponta=B if f % 2 else W)
        quadros.append((t.contorno(), 80))
    return quadros


def tramando():
    """Planejando a travessura: sobrancelha brava, sorriso malvado, esfregando as mãos."""
    quadros = []
    for f in range(8):
        t = Tela()
        perto = f % 2
        mascote(t, 10, 13, olhos='malvado', boca='malvado', sobrancelha='brava', bob=1 if f % 4 >= 2 else 0,
                mao_e=(3 + perto, 3 - perto), mao_d=(-3 - perto, 3 - perto), ponta=B if f % 4 < 2 else BD)
        quadros.append((t.contorno(), 140))
    return quadros


def espiando():
    """Escondido, olhando pros lados."""
    seq = ['esq', 'esq', 'esq', 'aberto', 'dir', 'dir', 'dir', 'aberto', 'fechado', 'aberto']
    quadros = []
    for olhos in seq:
        t = Tela()
        mascote(t, 10, 13, olhos=olhos, boca='reta')
        quadros.append((t.contorno(), 220 if olhos != 'fechado' else 90))
    return quadros


def assustado():
    """Pulo de susto quando é achado."""
    pulo = [0, -2, -4, -5, -4, -2, 0, 1, 0, 0]
    quadros = []
    for f, dy in enumerate(pulo):
        t = Tela()
        t.pts(26, 2, EXCLAMACAO, RD)
        if dy < 0:
            t.pts(22, 9 + dy, [(0, 0), (0, 1), (1, 1)], B)
        mascote(t, 10, 13, olhos='ponto', boca='o', bob=dy, pernas='pulo' if dy < 0 else 'pe',
                mao_e=(-1, -3) if dy < 0 else (0, -1), mao_d=(1, -3) if dy < 0 else (0, -1), ponta=RD)
        quadros.append((t.contorno(), 70 if f < 7 else 250))
    return quadros


def emburrado():
    """Bravinho de braços cruzados (quando você escapa)."""
    quadros = []
    for f in range(10):
        t = Tela()
        bob = 1 if f in (3, 4, 8) else 0
        if f % 4 < 2:
            t.pts(22, 6 - f % 2, [(0, 1), (1, 0), (2, 1)], S)
            t.pts(8, 6 - f % 2, [(0, 1), (1, 0), (2, 1)], S)
        mascote(t, 10, 13, olhos='baixo', boca='bico', sobrancelha='brava', bob=bob,
                mao_e=(4, 3), mao_d=(-4, 3), ponta=RD if f % 2 else W)
        quadros.append((t.contorno(), 160))
    return quadros


def convencido():
    """Piscadinha com a língua de fora (depois que esconde o seu mouse)."""
    quadros = []
    for f in range(10):
        t = Tela()
        bob = 1 if f % 4 >= 2 else 0
        mascote(t, 10, 13, olhos='piscada' if f < 7 else 'feliz', boca='lingua', bochecha=True, bob=bob,
                mao_d=(1, -4 - bob), ponta=W if f % 2 else B)
        if f in (2, 3):
            t.pts(5, 9, BRILHO, W)
        quadros.append((t.contorno(), 140))
    return quadros


def bocejando():
    """Bocejo antes de dormir."""
    roteiro = [('reta', 0), ('o', 0), ('bocejo', -2), ('bocejo', -3), ('bocejo', -3), ('bocejo', -2), ('o', 0), ('reta', 0)]
    quadros = []
    for boca, braco in roteiro:
        t = Tela()
        mascote(t, 10, 13, olhos='fechado', boca=boca, bob=0 if braco else 1,
                mao_e=(-1, braco), mao_d=(1, braco), ponta=BD)
        quadros.append((t.contorno(), 220))
    return quadros


ANIMACOES = {
    'parado': parado,
    'digitando': digitando,
    'programando': programando,
    'feliz': feliz,
    'acenando': acenando,
    'pensando': pensando,
    'dormindo': dormindo,
    'erro': erro,
    'andando': andando,
    'carregando': carregando,
    'rindo': rindo,
    'tramando': tramando,
    'espiando': espiando,
    'assustado': assustado,
    'emburrado': emburrado,
    'convencido': convencido,
    'bocejando': bocejando,
}


# ---------------------------------------------------------------- exportação

def juntar_repetidos(quadros):
    saida = []
    for t, ms in quadros:
        if saida and saida[-1][0].px == t.px:
            saida[-1] = (saida[-1][0], saida[-1][1] + ms)
        else:
            saida.append((t, ms))
    return saida


def imagem_rgba(t, escala, fundo=None):
    img = Image.new('RGBA', (t.w, t.h), fundo + (255,) if fundo else (0, 0, 0, 0))
    for (x, y), c in t.px.items():
        img.putpixel((x, y), c + (255,))
    return img.resize((t.w * escala, t.h * escala), Image.NEAREST)


def salvar_gif(quadros, caminho, escala):
    cores = sorted({c for t, _ in quadros for c in t.px.values()})
    indice = {c: i + 1 for i, c in enumerate(cores)}
    paleta = [255, 0, 255] + [v for c in cores for v in c]
    paleta += [0] * (768 - len(paleta))
    imgs = []
    for t, _ in quadros:
        img = Image.new('P', (t.w, t.h), 0)
        img.putpalette(paleta)
        img.putdata([indice.get(t.px.get((x, y)), 0) for y in range(t.h) for x in range(t.w)])
        imgs.append(img.resize((t.w * escala, t.h * escala), Image.NEAREST))
    imgs[0].save(caminho, save_all=True, append_images=imgs[1:], duration=[ms for _, ms in quadros],
                 loop=0, transparency=0, disposal=2, optimize=False)


def hexa(c):
    return '#%02x%02x%02x' % c


def caminhos_svg(t):
    por_cor = {}
    for y in range(t.h):
        x = 0
        while x < t.w:
            c = t.px.get((x, y))
            if c is None:
                x += 1
                continue
            ini = x
            while x < t.w and t.px.get((x, y)) == c:
                x += 1
            por_cor.setdefault(c, []).append('M%d %dh%dv1h-%dz' % (ini, y, x - ini, x - ini))
    return ''.join('<path fill="%s" d="%s"/>' % (hexa(c), ''.join(d)) for c, d in sorted(por_cor.items()))


def salvar_svg(quadros, caminho, escala):
    w, h = quadros[0][0].w, quadros[0][0].h
    total = sum(ms for _, ms in quadros)
    unicos = []  # [(px, tela, [(ini, fim), ...])]
    agora = 0
    for t, ms in quadros:
        for px, _, intervalos in unicos:
            if px == t.px:
                intervalos.append((agora, agora + ms))
                break
        else:
            unicos.append((t.px, t, [(agora, agora + ms)]))
        agora += ms

    css, grupos = [], []
    for i, (_, t, intervalos) in enumerate(unicos):
        grupos.append('<g class="q%d">%s</g>' % (i, caminhos_svg(t)))
        if len(unicos) == 1:
            continue
        inicio_visivel = 1 if intervalos[0][0] == 0 else 0
        chaves = {0.0: inicio_visivel}
        for ini, fim in intervalos:
            chaves[ini / total * 100] = 1
            if fim < total:
                chaves[fim / total * 100] = 0
        chaves[100.0] = inicio_visivel
        kf = ''.join('%.3f%%{opacity:%d}' % (p, v) for p, v in sorted(chaves.items()))
        css.append('.q%d{opacity:%d;animation:a%d %dms step-end infinite}@keyframes a%d{%s}'
                   % (i, inicio_visivel, i, total, i, kf))
    css.append('@media (prefers-reduced-motion:reduce){g{animation:none!important;opacity:0}.q0{opacity:1}}')

    svg = ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 %d %d" width="%d" height="%d" '
           'shape-rendering="crispEdges"><style>%s</style>%s</svg>\n'
           % (w, h, w * escala, h * escala, ''.join(css), ''.join(grupos)))
    with open(caminho, 'w') as f:
        f.write(svg)


def main():
    for pasta in ('gif', 'svg', 'png'):
        os.makedirs(os.path.join(PASTA, pasta), exist_ok=True)

    for nome, fn in ANIMACOES.items():
        quadros = juntar_repetidos(fn())
        salvar_gif(quadros, os.path.join(PASTA, 'gif', '%s.gif' % nome), 8)
        salvar_gif(quadros, os.path.join(PASTA, 'gif', '%s-128.gif' % nome), 4)
        salvar_svg(quadros, os.path.join(PASTA, 'svg', '%s.svg' % nome), 8)
        imagem_rgba(quadros[0][0], 16).save(os.path.join(PASTA, 'png', '%s.png' % nome))
        print('ok', nome, len(quadros), 'quadros')

    # avatar quadrado com fundo escuro (bom pro bot / perfil do Discord)
    imagem_rgba(parado()[0][0], 16, fundo=K).save(os.path.join(PASTA, 'png', 'avatar.png'))
    imagem_rgba(feliz()[0][0], 16, fundo=K).save(os.path.join(PASTA, 'png', 'avatar-feliz.png'))


if __name__ == '__main__':
    main()
