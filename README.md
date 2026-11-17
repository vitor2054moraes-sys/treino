# Ferro — plano de força

**Ferro** (de "puxar ferro") é um app de treino de força para o celular: treinos A e B alternados, a carga de cada
exercício sobe sozinha quando você bate as repetições, e um cronômetro de descanso fica sempre à mão.
Funciona no navegador, sem instalar nada, e os dados ficam só no aparelho.

## O que faz

- **Treino do dia** (A ou B) com a carga de cada exercício, as **anilhas de cada lado** da barra e o **aquecimento**
  (4 séries, em um toque).
- **Progressão automática:** bateu a meta em todas as séries, a carga sobe; na 1ª falha, mantém; na 2ª seguida, cai
  10% (deload), sem passar do piso.
- **Histórico** de cada sessão, com o que mudou, e **Desfazer** a última.
- **Cronômetro** de descanso (1:30, 2:00, 3:00) e de **prancha** (meta de 30 a 45 s), com som e vibração. Ele conta
  pelo relógio do aparelho: com a tela bloqueada, o tempo continua certo.
- **Tela acesa** durante o treino (nos navegadores que deixam).
- **Cópia de segurança:** copiar e importar os dados (a cópia é conferida antes de entrar).

## Personalizar

No começo do `app.js` (seção 1): a barra, as anilhas que você tem, os exercícios de cada treino, quanto sobe por
vez e as cargas iniciais.

## Segurança e privacidade

- Os dados ficam só no navegador (localStorage); nada vai para a internet.
- A tela é montada pelo DOM: o texto de uma cópia importada entra como texto, nunca como código.
- Cópia em formato errado é recusada; dado estragado não trava a página (volta às cargas iniciais).
- A página só carrega arquivos dela mesma (Content-Security-Policy).

## Arquivos

`index.html` (a página) · `style.css` (a aparência) · `app.js` (as regras e a tela) · `icone.svg` (o ícone).
