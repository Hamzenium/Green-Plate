import React, { useEffect, useState } from 'react'
import axios from 'axios';

export default function Dashboard() {
	const [showPreferences, setShowPreferences] = useState(false);
	const [loadingImage, setLoadingImage] = useState(false);
	const [ingredients, setIngredients] = useState([]);
	const [loadingRecipes, setLoadingRecipes] = useState(false);
	const [loadingItems, setLoadingItems] = useState(true);
	const [recipes, setRecipes] = useState([]);
	const [userDoc, setUser] = useState(null);
	const [showRecipeModal, setShowRecipeModal] = useState(false);
	const [recipe, setRecipe] = useState("");
	const [loadRecipe, setLoadRecipe] = useState(true);
	const [selected, setSelected] = useState([]);

	useEffect(() => {
		var user = localStorage.getItem("firebase_user_green_plates");
		if (!user) {
			window.location = "/";
		} else {
			user = JSON.parse(user);
			setUser(user);
			axios.post(`https://green-plate-727ad6cd0524.herokuapp.com/create/user`, {
				name: user.displayName,
				email: user.email
			}).then(doc => {
				setIngredients(doc.data.items);
				setSelected(doc.data.preference);
				setLoadingItems(false);
			});
		}
	}, []);

	const handleImageUpload = (e, type) => {
		e.preventDefault();
		setLoadingImage(true);

		if (!e.target.files[0]) {
			alert('Please select a file.');
			return;
		}

		const formData = new FormData();
		formData.append(undefined, e.target.files[0]);

		axios.post(`https://green-plate-727ad6cd0524.herokuapp.com/upload`, formData, {
			headers: {
				'Content-Type': 'multipart/form-data'
			}
		}).then(doc => {
			axios.put(`https://green-plate-727ad6cd0524.herokuapp.com/add/items`, {
				email: userDoc.email,
				items: doc.data.item.message.content
			}).then(doc => {
				axios.post(`https://green-plate-727ad6cd0524.herokuapp.com/dashboard`, {
					email: userDoc.email
				}).then(doc => {
					setIngredients(doc.data.items);
					setLoadingItems(false);
				}).catch(e => {
					setLoadingItems(false);
				});
			});
			setLoadingImage(false);
		}).catch(e => {
			console.log(e);
			setLoadingImage(false);
		});
	}

	return (
		<div className='Dashboard'>
			<div className='inner'>
				<div className='col'>
					<div className='box'>
						<div class="wrapper">
							{!loadingImage ?
								<div>
									<div className='add'>
										Add Item +
									</div>
									<input id="picture" name="picture" accept="image/*" type="file" onChange={e => handleImageUpload(e, "main")} />
								</div>
								: <img width={25} src="https://media.tenor.com/t5DMW5PI8mgAAAAi/loading-green-loading.gif" />}
						</div>
					</div>
					<div className='box'>
						<h3>Your Ingredients</h3>
						{!loadingItems ?
							<ul style={{ height: 350, overflowY: "scroll" }}>
								{ingredients.map((item, index) => {
									return <li key={index}>{item} <div> <img onClick={() => {
										axios.post(`https://green-plate-727ad6cd0524.herokuapp.com/deleteItem`, {
											email: userDoc.email,
											itemIndex: index
										}).then(doc => {
											axios.post(`https://green-plate-727ad6cd0524.herokuapp.com/dashboard`, {
												email: userDoc.email
											}).then(doc => {
												setIngredients(doc.data.items);
											});
										});
									}} width={10} src="https://static-00.iconduck.com/assets.00/delete-icon-1877x2048-1t1g6f82.png" /></div></li>
								})}
							</ul> : <img width={60} src="https://media.tenor.com/t5DMW5PI8mgAAAAi/loading-green-loading.gif" />
						}
					</div>
				</div>
				<div className='col'>
					<h3 style={{
						display: "flex",
						flexDirection: "row",
						justifyContent: "space-between",
						alignItems: "center"
					}}>Recipe List <button className='btn pref' style={{ fontSize: 12, maxWidth: 200 }} onClick={() => setShowPreferences(true)}>
							Manage Preferences
						</button></h3>
					<button className='btn' style={ingredients.length < 1 ? { opacity: 0.6 } : { opacity: 1 }} disabled={ingredients.length < 1} onClick={() => {
						setLoadingRecipes(true);
						axios.post(`https://green-plate-727ad6cd0524.herokuapp.com/create/recipe`, {
							email: userDoc.email
						}).then(doc => {
							console.log(doc.data);
							setRecipes(JSON.parse(doc.data).recipes || JSON.parse(doc.data).healthy_recipes);
							setLoadingRecipes(false);
						}).catch(e => {
							setLoadingItems(false);
						});
					}}>
						Generate Healthy Recipes
					</button>
					{loadingRecipes ? <img style={{ display: "block", margin: "auto", marginTop: 50 }} width={60} src="https://media.tenor.com/t5DMW5PI8mgAAAAi/loading-green-loading.gif" /> :
						<div style={{ height: 400, overflowY: "scroll" }}>
							{recipes.map(recipe => {
								return (
									<div className='recipe' style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center", fontSize: 13 }} onClick={() => {
										setLoadRecipe(true);
										setShowRecipeModal(true);
										setRecipe({ name: recipe.name, content: "" });
										axios.post(`https://green-plate-727ad6cd0524.herokuapp.com/create/recipe/steps`, {
											itemName: recipe.name
										}).then(doc => {
											console.log(doc.data);
											setRecipe({ name: recipe.name, content: doc.data });
											setLoadRecipe(false);
										});
									}}>
										{recipe.name} <span style={{ color: "grey" }}>{recipe.calories}</span>
									</div>
								)
							})}
						</div>
					}
				</div>
			</div>
			{showPreferences ?
				<div className='preferences'>
					<div className='backdrop'></div>
					<div className='modal'>
						<h4 style={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>Preferences <button onClick={() => setShowPreferences(false)} style={{
							backgroundColor: "#f3f3f3",
							border: 0,
							padding: 10,
							cursor: "pointer"
						}}>Close</button></h4>
						<input checked={selected.includes("spicy")} type="checkbox" id="spicy" name="spicy" value="spicy" onChange={() => setSelected([...selected, "spicy"])} />
						<label for="spicy"> Spicy</label><br /><br />

						<input checked={selected.includes("sweet")} type="checkbox" id="sweet" name="sweet" value="sweet" onChange={() => setSelected([...selected, "sweet"])} />
						<label for="sweet"> Sweet</label><br /><br />

						<input checked={selected.includes("savoury")} type="checkbox" id="savoury" name="savoury" value="savoury" onChange={() => setSelected([...selected, "savoury"])} />
						<label for="savoury"> Savoury</label><br /><br />

						<input checked={selected.includes("gluten-free")} type="checkbox" id="gluten-free" name="gluten-free" value="gluten-free" onChange={() => setSelected([...selected, "gluten-free"])} />
						<label for="gluten-free"> Gluten-Free</label><br /><br />

						<input checked={selected.includes("keto")} type="checkbox" id="Keto" name="Keto" value="Keto" onChange={() => setSelected([...selected, "keto"])} />
						<label for="Keto"> Keto</label><br /><br />

						<input checked={selected.includes("vegetarian")} type="checkbox" id="veg" name="veg" value="veg" onChange={() => setSelected([...selected, "vegetarian"])} />
						<label for="veg"> Vegetarian</label><br /><br />

						<br /><br />
						<button className='btn' onClick={() => {
							setShowPreferences(false);
							setLoadingRecipes(true);
							axios.put(`https://green-plate-727ad6cd0524.herokuapp.com/add/preferences`, {
								email: userDoc.email,
								preference: selected
							}).then(doc => {
								axios.post(`https://green-plate-727ad6cd0524.herokuapp.com/create/recipe`, {
									email: userDoc.email
								}).then(doc2 => {
									setRecipes(JSON.parse(doc2.data).recipes);
									setLoadingRecipes(false);
								}).catch(e => {
									setLoadingItems(false);
								});
							});
						}}>Apply</button>
					</div>
				</div>
				: null}
			{showRecipeModal ?
				<div className='preferences'>
					<div className='backdrop'></div>
					<div className='modal'>
						<h4 style={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>{recipe.name} <button onClick={() => setShowRecipeModal(false)} style={{
							backgroundColor: "#f3f3f3",
							border: 0,
							padding: 10,
							cursor: "pointer"
						}}>Close</button></h4>
						{loadRecipe ? <img width={40} src="https://media.tenor.com/t5DMW5PI8mgAAAAi/loading-green-loading.gif" /> :
							<p>{recipe.content}</p>
						}
					</div>
				</div>
				: null
			}
		</div>
	)
}
