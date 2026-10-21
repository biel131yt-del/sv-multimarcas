# 📸 Fotos dos veículos

Coloque aqui as **fotos reais** de cada veículo do estoque.

## Convenção de nomes

```
<id>-<angulo>.jpg
```

Exemplos:

```
1-frente.jpg
1-interior.jpg
1-traseira.jpg
1-detalhe1.jpg
2-frente.jpg
2-interior.jpg
2-traseira.jpg
```

- `<id>` = o mesmo `id` do veículo em `data/vehicles.js`
- `<angulo>` = `frente` | `interior` | `traseira` | `detalhe1` | `detalhe2` ...

## Mínimo para cada veículo

| Ângulo | Obrigatório | Como aparece no site |
|---|---|---|
| `frente` | ✅ Sim | Capa do anúncio (card no estoque e topo da página do veículo) |
| `interior` | ✅ Sim | 2ª foto da galeria |
| `traseira` | ✅ Sim | 3ª foto da galeria |
| `detalhe1`+ | Opcional | Fotos extras na galeria |

> **Por que esses 3?** O cliente decide se quer o carro só vendo frente, interior
> e traseira. Sem interior e traseira, ele não consegue se imaginar usando o
> veículo e precisa perguntar — o que gera trabalho desnecessário.

## Como publicar

1. Coloque os arquivos nesta pasta (`images/carros/`)
2. No painel admin: **Estoque publicado → Baixar vehicles.js**
3. Substitua o arquivo baixado em `data/vehicles.js`

O caminho da foto é gerado automaticamente pelo painel — você não precisa
digitar nada.

## Dicas de foto (vendem mais)

- **Frente:** 3/4 (diagonal), luz natural, sem gente na frente
- **Interior:** painel, volante e banco visíveis — sem objetos pessoais
- **Traseira:** 3/4 traseira com uma lateral, mostra a carroceria inteira
- Tire as fotos com o carro **limpo** e em **local aberto**
- Resolução mínima: 1200px de lado maior (o site otimiza para web)
