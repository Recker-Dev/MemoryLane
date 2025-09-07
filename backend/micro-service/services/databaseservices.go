package services
import (
	"context"

	"github.com/Recker-Dev/NextJs-GPT/backend/micro-service/config"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func FindExactlyOne[T any](collectionName string, filter any) (T, error) {
	collection := config.GetCollection(collectionName)

	var result T
	err := collection.FindOne(context.Background(), filter).Decode(&result)
	return result, err

}

func FindMany[T any](collectionName string, filter any) ([]T, error) {
	collection := config.GetCollection(collectionName)

	cursor, err := collection.Find(context.Background(), filter)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(context.Background())

	var results []T
	if err := cursor.All(context.Background(), &results); err != nil {
		return nil, err
	}

	return results, nil
}

func UpdateManyByIds(collectionName string, IDs []primitive.ObjectID, update bson.M) (matched int64, modified int64, err error) {
	uploadCollection := config.GetCollection(collectionName)

	filter := bson.M{
		"_id": bson.M{
			"$in": IDs,
		},
	}

	result, err := uploadCollection.UpdateMany(
		context.Background(),
		filter,
		update,
	)
	if err != nil {
		return 0, 0, err
	}

	return result.MatchedCount, result.ModifiedCount, nil

}

func DeleteManyByIds(collection string, IDs []primitive.ObjectID) (deleted int64, err error) {
	coll := config.GetCollection(collection)

	filter := bson.M{
		"_id": bson.M{
			"$in": IDs,
		},
	}

	result, err := coll.DeleteMany(
		context.Background(),
		filter,
	)
	if err != nil {
		return 0, err
	}

	return result.DeletedCount, nil

}
