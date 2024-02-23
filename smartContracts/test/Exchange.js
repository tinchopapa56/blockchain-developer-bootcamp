const { expect } = require('chai');
const { ethers } = require('hardhat');

const tokens = (n) => {
    return ethers.utils.parseUnits(n.toString(), 'ether')
}

describe('Exchange', () => {
    let deployer, feeAccount, exchange, token1, token2, user2, user1;
    const feePercent = 10

    beforeEach(async () => {
        const Exchange = await ethers.getContractFactory("Exchange")
        const Token = await ethers.getContractFactory("Token")
        token1 = await Token.deploy("Dapp University", "DAPP", "1000000")
        token2 = await Token.deploy("Dai", "MDAI", "2000000")

        accounts = await ethers.getSigners()
        deployer = accounts[0]
        feeAccount = accounts[1]
        user1 = accounts[2]
        user2 = accounts[3]

        //trasnfer tokens to user =>
        let tx = await token1.connect(deployer).transfer(user1.address, tokens(100))
        await tx.wait()

        exchange = await Exchange.deploy(feeAccount.address, feePercent)
    })
    describe('Deployment', () => {

        it("tracks fee account", async () => {
            expect(await exchange.feeAccount()).to.equal(feeAccount.address)
        })
        it("tracks fee percent", async () => {
            expect(await exchange.feePercent()).to.equal(feePercent)
        })
    })
    describe("Deposit Tokens", () => {
        let tx, res, amount = tokens(100);

        describe("Success", () => {

            beforeEach(async () => {
                // console.log("debug TEST_file",user1.address,exchange.address,amount.toString())

                //approve 
                tx = await token1.connect(user1).approve(exchange.address, amount)
                res = await tx.wait()
                //depost
                tx = await exchange.connect(user1).depositToken(token1.address, amount)
                res = await tx.wait()
            })

            it("tracks the token deposit", async () => {
                expect(await token1.balanceOf(exchange.address)).to.equal(amount)
                expect(await exchange.tokens(token1.address, user1.address)).to.equal(amount)
                expect(await exchange.balanceOf(token1.address, user1.address)).to.equal(amount)
            })
            it("emits deposit event", async () => {
                const event = res.events[1]
                expect(event.event).to.equal("Deposit")

                const args = event.args
                expect(args.token).to.equal(token1.address)
                expect(args.user).to.equal(user1.address)
                expect(args.amount).to.equal(amount)
                expect(args.balance).to.equal(amount)
            })
        })
        describe("Failure", () => {
            it("fails when no tokens approved ", async () => {
                const tx_to_fail = exchange.connect(user1).depositToken(token1.address, amount)
                expect(tx_to_fail).to.be.reverted;
                expect(tx_to_fail).to.be.revertedWith("token approval failed");
            })
        })
    })
    describe("WITHDRAW f(x)", () => {
        let tx, res, amount = tokens(100);

        describe("Success", () => {

            beforeEach(async () => {

                //approve 
                tx = await token1.connect(user1).approve(exchange.address, amount)
                res = await tx.wait()
                //depost
                tx = await exchange.connect(user1).depositToken(token1.address, amount)
                res = await tx.wait()

                //WITHDRAW
                tx = await exchange.connect(user1).withdrawToken(token1.address, amount)
                res = await tx.wait()
            })

            it("withdraw token specified amount", async () => {
                expect(await token1.balanceOf(exchange.address)).to.equal(0)
                expect(await exchange.tokens(token1.address, user1.address)).to.equal(0)
                expect(await exchange.balanceOf(token1.address, user1.address)).to.equal(0)
            })
            it("emits witdhrawla event", async () => {
                const event = res.events[1]
                expect(event.event).to.equal("Withdrawal")

                const args = event.args
                expect(args.token).to.equal(token1.address)
                expect(args.user).to.equal(user1.address)
                expect(args.amount).to.equal(amount)
                expect(args.balance).to.equal(0)
            })
        })
        describe("Failure", () => {
            it("fails for insufficient balance ", async () => {
                const tx_to_fail = exchange.connect(user1).withdrawToken(token1.address, amount)
                await expect(tx_to_fail).to.be.revertedWith("insufficient balance for witdhrawal");
            })
        })
    })
    describe("Balance of f(X)", () => {
        it("returns user balanceracks the token deposit", async () => {
            let tx, res, amount = tokens(1);
            //approve 
            tx = await token1.connect(user1).approve(exchange.address, amount)
            res = await tx.wait()
            //depost
            tx = await exchange.connect(user1).depositToken(token1.address, amount)
            res = await tx.wait()

            expect(await exchange.balanceOf(token1.address, user1.address)).to.equal(amount)
        })

    })


    describe("Make Order", () => {
        let tx, res, amount = tokens(100);
        let buyAmount = tokens(20)
        let sellAmount = tokens(1)

        describe("Success", () => {

            beforeEach(async () => {
                //approve 
                tx = await token1.connect(user1).approve(exchange.address, amount)
                res = await tx.wait()
                //depost
                tx = await exchange.connect(user1).depositToken(token1.address, amount)
                res = await tx.wait()

                //MAKE ORDER 
                tx = await exchange.connect(user1).makeOrder(token2.address, buyAmount, token1.address, sellAmount)
                res = await tx.wait()
            })

            it("Tracks newly created order", async () => {
                expect(await exchange.ordersCount()).to.equal(1)
                expect(await exchange.ordersCount()).not.to.equal(2)

            })
            it("emits CreatedOrder event", async () => {
                const event = res.events[0]

                expect(event.event).to.equal("CreatedOrder")

                const args = event.args
                expect(args.id).to.equal(1)
                expect(args.user).to.equal(user1.address)
                expect(args.tokenToBuy).to.equal(token2.address)
                expect(args.tokenToSell).to.equal(token1.address)
                expect(args.amountToBuy).to.equal(buyAmount)
                expect(args.amountToSell).to.equal(sellAmount)
                expect(args.timestamp).to.at.least(1)
            })
        })
        describe("Failure", async () => {

            it("REJECTS, not enough balance", async () => {
                await expect(exchange.connect(user1).makeOrder(token1.address, tokens(10000), token2.address, tokens(150000)))
                    .to.be.revertedWith('You have Insufficient balance for making order')
            })

        })
    })

    describe("Order Actions", () => {

        let transaction, result;
        let amount = tokens(1)

        beforeEach(async () => {
            // user1 deposits tokens
            transaction = await token1.connect(user1).approve(exchange.address, amount)
            result = await transaction.wait()

            transaction = await exchange.connect(user1).depositToken(token1.address, amount)
            result = await transaction.wait()

            // Give tokens to user2 == user 2 recibe 100tkn           (tiene 100 en su wallet)
            transaction = await token2.connect(deployer).transfer(user2.address, tokens(100))
            result = await transaction.wait()

            // user2 deposits tokens == user 2 pone 2tkn en exchang   (tiene 98 en su wallet)
            transaction = await token2.connect(user2).approve(exchange.address, tokens(2))
            result = await transaction.wait()

            transaction = await exchange.connect(user2).depositToken(token2.address, tokens(2))
            result = await transaction.wait()

            // Make an order
            transaction = await exchange.connect(user1).makeOrder(token2.address, amount, token1.address, amount)
            result = await transaction.wait()
        })

        describe("Cancel order", async () => {
            describe("Success", () => {
                beforeEach(async () => {
                    //ACTUALLY CANCEL_ORDER
                    tx = await exchange.connect(user1).cancelOrder(1)
                    res = await tx.wait()
                })
                it("updatesCancelledOrders", async () => {
                    expect(await exchange.ordersCancelled(1)).to.equal(true)
                })
                it("emits CancelledOrder event", async () => {
                    const event = res.events[0]

                    expect(event.event).to.equal("CancelledOrder")

                    const args = event.args
                    expect(args.id).to.equal(1)
                    expect(args.user).to.equal(user1.address)
                    expect(args.tokenToBuy).to.equal(token2.address)
                    expect(args.tokenToSell).to.equal(token1.address)
                    expect(args.amountToBuy).to.equal(tokens(1)) //amount
                    expect(args.amountToSell).to.equal(tokens(1)) //(amount)
                    expect(args.timestamp).to.at.least(1)
                })
            })
            describe("Failure", async () => {

                beforeEach(async () => {
                    // user1 deposits tokens
                    transaction = await token1.connect(user1).approve(exchange.address, amount)
                    result = await transaction.wait()
                    transaction = await exchange.connect(user1).depositToken(token1.address, amount)
                    result = await transaction.wait()
                    // Make an order
                    transaction = await exchange.connect(user1).makeOrder(token2.address, amount, token1.address, amount)
                    result = await transaction.wait()
                })

                it('rejects invalid order ids', async () => {
                    const invalidOrderId = 99999
                    await expect(exchange.connect(user1).cancelOrder(invalidOrderId)).to.be.revertedWith("order id doesnt exist")
                })

                it('rejects unauthorized cancelations', async () => {
                    await expect(exchange.connect(user2).cancelOrder(1)).to.be.revertedWith("only order creator can cancel it")
                })

            })
        })

        describe("Fill order", async () => {
            beforeEach(async () => {
                // user2 fills order
                transaction = await exchange.connect(user2).fillOrder(1)
                result = await transaction.wait()
            })

            it('executes the trade and charge fees', async () => {
                // Token Give
                expect(await exchange.balanceOf(token1.address, user1.address)).to.equal(tokens(0))
                expect(await exchange.balanceOf(token1.address, user2.address)).to.equal(tokens(1))
                expect(await exchange.balanceOf(token1.address, feeAccount.address)).to.equal(tokens(0))
                // Token get
                expect(await exchange.balanceOf(token2.address, user1.address)).to.equal(tokens(1))
                expect(await exchange.balanceOf(token2.address, user2.address)).to.equal(tokens(0.9))
                expect(await exchange.balanceOf(token2.address, feeAccount.address)).to.equal(tokens(0.1))
                expect(await token2.balanceOf(user2.address)).to.equal(tokens(98))
            })
            it('Marks order filled', async () => {
                expect(await exchange.ordersFilled(1)).to.equal(true)
            })
            it('emits TRADE event', async () => {
                const event = result.events[0]
                expect(await event.event).to.equal("Trade")

                const args = event.args
                expect(args.id).to.equal(1)
                expect(args.user).to.equal(user2.address)
                expect(args.tokenGet).to.equal(token2.address)
                expect(args.amountGet).to.equal(tokens(1))
                expect(args.tokenGive).to.equal(token1.address)
                expect(args.amountGive).to.equal(tokens(1))
                expect(args.creator).to.equal(user1.address)
                expect(args.timestamp).to.at.least(1)
            })

            describe("Failure", async () => {

                it('rejects invalid order ids', async () => {
                    const invalidOrderId = 99999
                    await expect(exchange.connect(user1).cancelOrder(invalidOrderId)).to.be.revertedWith("order id doesnt exist")
                })

                it('rejects already filled orders', async () => {
                    //ya se lleno en el before each
                    await expect(exchange.connect(user2).fillOrder(1)).to.be.revertedWith("order was filled, it is no longer available")
                })
                it('rejects already cancelled orders', async () => {
                    //ya se lleno en el before each
                    transaction = await exchange.connect(user1).cancelOrder(1)
                    await transaction.wait();

                    await expect(exchange.connect(user2).fillOrder(1)).to.be.revertedWith("order is already cancelled")
                })


            })

        })

    })
})