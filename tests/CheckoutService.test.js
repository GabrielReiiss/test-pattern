import { CheckoutService } from "../src/services/CheckoutService.js";
import { CarrinhoBuilder } from "./builders/CarrinhoBuilder.js";
import { UserMother } from "./builders/UserMother.js";
import { Item } from "../src/domain/Item.js";
import { Pedido } from "../src/domain/Pedido.js";

describe("quando o pagamento falha", () => {
  test("deve retornar null", async () => {
    // Arrange
    const carrinho = new CarrinhoBuilder().build();
    const gatewayStub = {
      cobrar: jest.fn().mockResolvedValue({ success: false }),
    };
    const repositoryDummy = { salvar: jest.fn() };
    const emailDummy = { enviarEmail: jest.fn() };
    const checkoutService = new CheckoutService(
      gatewayStub,
      repositoryDummy,
      emailDummy,
    );

    // Act
    const pedido = await checkoutService.processarPedido(
      carrinho,
      "1234-5678-9012-3456",
    );

    // Assert
    expect(pedido).toBeNull();
  });
});

describe("quando um cliente Premium finaliza a compra", () => {
  test("deve cobrar com 10% de desconto e enviar e-mail de confirmação", async () => {
    // Arrange
    const usuarioPremium = UserMother.umUsuarioPremium();
    const carrinho = new CarrinhoBuilder()
      .comUser(usuarioPremium)
      .comItens([new Item("Produto A", 150), new Item("Produto B", 50)])
      .build();

    const gatewayStub = {
      cobrar: jest.fn().mockResolvedValue({ success: true }),
    };
    const pedidoSalvo = new Pedido(1, carrinho, 180, "PROCESSADO");
    const repositoryStub = {
      salvar: jest.fn().mockResolvedValue(pedidoSalvo),
    };
    const emailMock = { enviarEmail: jest.fn() };

    const checkoutService = new CheckoutService(
      gatewayStub,
      repositoryStub,
      emailMock,
    );

    // Act
    const pedido = await checkoutService.processarPedido(
      carrinho,
      "1234-5678-9012-3456",
    );

    // Assert
    expect(gatewayStub.cobrar).toHaveBeenCalledWith(180, "1234-5678-9012-3456");
    expect(emailMock.enviarEmail).toHaveBeenCalledTimes(1);
    expect(emailMock.enviarEmail).toHaveBeenCalledWith(
      "premium@email.com",
      "Seu Pedido foi Aprovado!",
      "Pedido 1 no valor de R$180",
    );
    expect(pedido).toBe(pedidoSalvo);
  });
});
