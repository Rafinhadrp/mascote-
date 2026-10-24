// Liga o mascote dentro da janela transparente do app de desktop.
(async () => {
  const ponte = window.mascoteDesktop;
  const { config, podeMoverCursor, area } = await ponte.info();
  let pet = null;
  let tamanho = null;

  // Liga de novo quando muda o tamanho pelo menu; o resto só atualiza.
  function aplicar(cfg) {
    if (!pet || cfg.tamanho !== tamanho) {
      tamanho = cfg.tamanho;
      pet = MascotePet.iniciar({
        ...cfg,
        saudar: !pet,
        sprites: 'sprites/',
        desktop: { ...ponte, podeMoverCursor, area },
      });
    }
    pet.pausar(!!cfg.pausado);
  }

  aplicar(config);
  ponte.aoConfig(aplicar);
  ponte.aoComando((nome) => pet.travessura(nome));
})();
